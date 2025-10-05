const express = require('express');
const { protect } = require('../middleware/auth');
const { createPreference, createCardPayment, getPayment, verifyWebhook } = require('../utils/mercadoPago');
const Order = require('../models/Order');
const Product = require('../models/Product');

const router = express.Router();

// Info de la cuenta de MP (solo desarrollo)
if (process.env.NODE_ENV !== 'production') {
  const https = require('https');
  router.get('/mp-info', (req, res) => {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN || (process.env.NODE_ENV === 'production' ? process.env.MERCADOPAGO_ACCESS_TOKEN_PROD : (process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN_PROD));
    if (!token) return res.status(200).json({ ok: true, message: 'Sin token configurado' });

    const options = {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    };

    const reqHttps = https.request('https://api.mercadopago.com/users/me', options, (resp) => {
      let body = '';
      resp.on('data', (chunk) => (body += chunk));
      resp.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          const label = token.startsWith('TEST-') ? 'TEST' : token.startsWith('APP_USR-') ? 'APP_USR' : 'CUSTOM';
          return res.json({
            ok: true,
            tokenLabel: label,
            site_id: data?.site_id,
            default_currency_id: data?.default_currency_id,
            user_id: data?.id,
            email: data?.email
          });
        } catch (e) {
          return res.status(500).json({ ok: false, error: e?.message || String(e), raw: body });
        }
      });
    });

    reqHttps.on('error', (err) => res.status(500).json({ ok: false, error: err?.message || String(err) }));
    reqHttps.end();
  });
}

// Crear preferencia de pago
router.post('/create-preference', protect, async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    
    // Validar que hay items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay productos en el carrito'
      });
    }

    // Calcular total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Producto ${item.productId} no encontrado`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para ${product.name}`
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
      });
    }

    // Crear pedido
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paymentMethod: 'mercadopago'
    });

    // Crear preferencia de Mercado Pago
    const itemsWithProducts = await Promise.all(
      orderItems.map(async item => ({
        product: await Product.findById(item.product),
        quantity: item.quantity,
        price: item.price
      }))
    );

    const preferenceData = {
      orderId: order._id.toString(),
      user: req.user,
      items: itemsWithProducts
    };

    const preference = await createPreference(preferenceData);

    // Si hubo error creando la preferencia, no redirigir, reportar al frontend
    if (!preference || preference.error || (!preference.init_point && !preference.sandbox_init_point)) {
      const devExtraErr = {};
      if (process.env.NODE_ENV !== 'production') {
        devExtraErr.currency = process.env.MP_CURRENCY_ID || 'COP';
        const token = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN_PROD;
        devExtraErr.tokenLabel = token?.startsWith('TEST-') ? 'TEST' : token?.startsWith('APP_USR-') ? 'APP_USR' : 'CUSTOM';
      }
      return res.status(500).json({
        success: false,
        message: preference?.error || 'No se pudo crear la preferencia de pago',
        details: devExtraErr
      });
    }

    // Guardar ID de preferencia
    order.mercadoPagoPreferenceId = preference.id;
    await order.save();

    const devExtra = {};
    if (process.env.NODE_ENV !== 'production') {
      try {
        const ip = preference?.init_point || preference?.sandbox_init_point;
        if (ip) {
          const u = new URL(ip);
          devExtra.init_point_host = u.host;
          devExtra.init_point_path = u.pathname;
        }
      } catch {}
      devExtra.currency = process.env.MP_CURRENCY_ID || 'COP';
      const token = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN_PROD;
      devExtra.tokenLabel = token?.startsWith('TEST-') ? 'TEST' : token?.startsWith('APP_USR-') ? 'APP_USR' : 'CUSTOM';
      devExtra.sandbox_init_point = preference.sandbox_init_point;
    }

    res.json({
      success: true,
      preferenceId: preference.id,
      init_point: preference.init_point,
      orderId: order._id,
      ...devExtra
    });
  } catch (error) {
    console.error('Error creando preferencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error procesando pago'
    });
  }
});

// Pago con tarjeta (Checkout API / Bricks)
router.post('/card', protect, async (req, res) => {
  try {
    const { items, payer, card } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No hay productos en el carrito' });
    }
    if (!card?.token) {
      return res.status(400).json({ success: false, message: 'Falta token de tarjeta' });
    }

    // Calcular total y reservar pedido
    let totalAmount = 0;
    const orderItems = [];
    for (const it of items) {
      const product = await Product.findById(it.productId);
      if (!product) return res.status(400).json({ success: false, message: `Producto ${it.productId} no encontrado` });
      if (product.stock < it.quantity) return res.status(400).json({ success: false, message: `Stock insuficiente para ${product.name}` });
      totalAmount += product.price * it.quantity;
      orderItems.push({ product: product._id, quantity: it.quantity, price: product.price });
    }

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalAmount,
      shippingAddress: req.body.shippingAddress || {},
      paymentMethod: 'mercadopago_card',
      paymentStatus: 'pending'
    });

    const payResp = await createCardPayment({
      token: card.token,
      installments: card.installments,
      payment_method_id: card.payment_method_id,
      issuer_id: card.issuer_id,
      payer: payer || { email: req.user.email },
      amount: totalAmount,
      description: 'Compra en tienda',
      orderId: order._id.toString()
    });

    if (!payResp || payResp.error) {
      return res.status(500).json({ success: false, message: payResp?.error || 'Error procesando pago', detail: payResp?.detail });
    }

    // Actualizar estado de la orden según respuesta
    order.mercadoPagoPaymentId = payResp.id;
    order.paymentStatus = payResp.status;
    if (payResp.status === 'approved') {
      order.status = 'processing';
      for (const it of order.items) {
        await Product.findByIdAndUpdate(it.product, { $inc: { stock: -it.quantity } });
      }
    }
    await order.save();

    res.json({ success: true, payment: { id: payResp.id, status: payResp.status, status_detail: payResp.status_detail }, orderId: order._id });
  } catch (err) {
    console.error('Error en pago con tarjeta:', err);
    res.status(500).json({ success: false, message: 'Error interno procesando pago' });
  }
});

// Webhook de Mercado Pago
router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment') {
      const paymentId = data.id;
      
      // Obtener información del pago
      const payment = await getPayment(paymentId);
      
      // Buscar pedido por external_reference
      const order = await Order.findOne({
        _id: payment.external_reference
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        });
      }

      // Actualizar estado del pedido
      order.mercadoPagoPaymentId = paymentId;
      
      if (payment.status === 'approved') {
        order.paymentStatus = 'approved';
        order.status = 'processing';
        
        // Reducir stock de productos
        for (const item of order.items) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: -item.quantity } }
          );
        }
      } else if (payment.status === 'rejected') {
        order.paymentStatus = 'rejected';
        order.status = 'cancelled';
      }

      await order.save();

      res.json({ success: true });
    }
  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error procesando webhook'
    });
  }
});

// Obtener estado de pago
router.get('/payment-status/:orderId', protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user.id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
        totalAmount: order.totalAmount
      }
    });
  } catch (error) {
    console.error('Error obteniendo estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estado del pago'
    });
  }
});

// Verificar pago por ID
router.get('/verify/:paymentId', protect, async (req, res) => {
  try {
    const payment = await getPayment(req.params.paymentId);
    
    const order = await Order.findOne({
      _id: payment.external_reference
    }).populate('items.product');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    res.json({
      success: true,
      order: order,
      payment: payment
    });
  } catch (error) {
    console.error('Error verificando pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando pago'
    });
  }
});

// Obtener estado de pago por payment ID
router.get('/status/:paymentId', protect, async (req, res) => {
  try {
    const payment = await getPayment(req.params.paymentId);
    
    res.json({
      success: true,
      id: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
      payment_method_id: payment.payment_method_id,
      transaction_amount: payment.transaction_amount
    });
  } catch (error) {
    console.error('Error obteniendo estado del pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo información del pago'
    });
  }
});

module.exports = router;