const express = require('express');
const { protect } = require('../middleware/auth');
const { createPreference, getPayment, verifyWebhook } = require('../utils/mercadoPago');
const Order = require('../models/Order');
const Product = require('../models/Product');

const router = express.Router();

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
    const preferenceData = {
      orderId: order._id.toString(),
      user: req.user,
      items: orderItems.map(async item => ({
        product: await Product.findById(item.product),
        quantity: item.quantity,
        price: item.price
      }))
    };

    const preference = await createPreference(preferenceData);

    // Guardar ID de preferencia
    order.mercadoPagoPreferenceId = preference.id;
    await order.save();

    res.json({
      success: true,
      data: {
        preferenceId: preference.id,
        initPoint: preference.init_point,
        orderId: order._id
      }
    });
  } catch (error) {
    console.error('Error creando preferencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error procesando pago'
    });
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

module.exports = router;