const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Order = require('../models/Order');
const Product = require('../models/Product');
const {
  createWompiTransaction,
  verifyWompiTransaction,
  processWompiWebhook,
  getAvailablePaymentMethods
} = require('../utils/wompi');

// Crear transacción con Wompi
router.post('/create-wompi-transaction', protect, async (req, res) => {
  try {
    const { items, customerData, shippingAddress, total, reference } = req.body;
    
    // Validar datos requeridos
    if (!items || !items.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'No hay productos en el carrito' 
      });
    }
    
    if (!customerData || !customerData.email || !customerData.fullName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Datos del cliente incompletos' 
      });
    }
    
    if (!shippingAddress || !shippingAddress.addressLine1 || !shippingAddress.city) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dirección de envío incompleta' 
      });
    }

    // Verificar stock de productos
    for (const item of items) {
      const product = await Product.findById(item.product._id);
      if (!product) {
        return res.status(400).json({ 
          success: false, 
          message: `Producto ${item.product.name} no encontrado` 
        });
      }
      
      if (!product.inStock || product.stock < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Stock insuficiente para ${product.name}` 
        });
      }
    }

    // Crear orden en la base de datos
    const order = new Order({
      user: req.user.id,
      items: items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.price
      })),
      total,
      customerData,
      shippingAddress,
      paymentMethod: 'wompi',
      status: 'pending',
      reference
    });

    await order.save();
    console.log(`📦 Orden creada: ${order._id}`);

    // Crear transacción con Wompi
    const wompiResult = await createWompiTransaction({
      items,
      customerData,
      shippingAddress,
      total,
      reference,
      orderId: order._id.toString()
    });

    if (!wompiResult.success) {
      // Si falla Wompi, marcar orden como fallida
      order.status = 'failed';
      await order.save();
      
      return res.status(500).json({
        success: false,
        message: 'Error al crear transacción con Wompi: ' + wompiResult.error
      });
    }

    res.json({
      success: true,
      orderId: order._id,
      transactionData: wompiResult.transactionData,
      message: 'Transacción creada exitosamente'
    });

  } catch (error) {
    console.error('Error creando transacción Wompi:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Verificar estado de transacción Wompi
router.get('/verify-wompi/:transactionId', protect, async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const result = await verifyWompiTransaction(transactionId);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Error verificando transacción: ' + result.error
      });
    }
    
    const transaction = result.transaction;
    
    // Buscar orden por referencia
    const order = await Order.findOne({ reference: transaction.reference });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }
    
    // Actualizar estado de la orden según el estado de Wompi
    let orderStatus = 'pending';
    
    switch (transaction.status) {
      case 'APPROVED':
        orderStatus = 'paid';
        // Reducir stock de productos
        for (const item of order.items) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: -item.quantity } }
          );
        }
        break;
      case 'DECLINED':
      case 'ERROR':
        orderStatus = 'failed';
        break;
      case 'VOIDED':
        orderStatus = 'cancelled';
        break;
      default:
        orderStatus = 'pending';
    }
    
    order.status = orderStatus;
    order.paymentId = transaction.id;
    order.paidAt = transaction.status === 'APPROVED' ? new Date() : undefined;
    await order.save();
    
    res.json({
      success: true,
      transaction,
      order: {
        id: order._id,
        status: order.status,
        total: order.total,
        reference: order.reference
      }
    });
    
  } catch (error) {
    console.error('Error verificando transacción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Webhook de Wompi
router.post('/wompi-webhook', async (req, res) => {
  try {
    const result = processWompiWebhook(req);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Webhook inválido'
      });
    }
    
    const event = result.event;
    
    // Procesar evento según tipo
    if (event.event === 'transaction.updated') {
      const transaction = event.data.transaction;
      
      // Buscar orden por referencia
      const order = await Order.findOne({ reference: transaction.reference });
      
      if (order) {
        // Actualizar estado
        let orderStatus = 'pending';
        
        switch (transaction.status) {
          case 'APPROVED':
            orderStatus = 'paid';
            // Reducir stock si no se ha hecho antes
            if (order.status !== 'paid') {
              for (const item of order.items) {
                await Product.findByIdAndUpdate(
                  item.product,
                  { $inc: { stock: -item.quantity } }
                );
              }
            }
            break;
          case 'DECLINED':
          case 'ERROR':
            orderStatus = 'failed';
            break;
          case 'VOIDED':
            orderStatus = 'cancelled';
            break;
        }
        
        order.status = orderStatus;
        order.paymentId = transaction.id;
        order.paidAt = transaction.status === 'APPROVED' ? new Date() : undefined;
        await order.save();
        
        console.log(`🔄 Orden ${order._id} actualizada: ${orderStatus}`);
      }
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error procesando webhook Wompi:', error);
    res.status(500).json({
      success: false,
      message: 'Error procesando webhook'
    });
  }
});

// Obtener métodos de pago disponibles
router.get('/wompi-methods', async (req, res) => {
  try {
    const result = await getAvailablePaymentMethods();
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Error obteniendo métodos de pago: ' + result.error
      });
    }
    
    res.json({
      success: true,
      methods: result.methods
    });
    
  } catch (error) {
    console.error('Error obteniendo métodos de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;