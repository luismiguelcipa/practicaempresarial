const express = require('express');
const { protect } = require('../middleware/auth');
const Order = require('../models/Order');
const Product = require('../models/Product');

const router = express.Router();

// Crear orden (para métodos de pago que no requieren procesamiento inmediato)
router.post('/create', protect, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, totalAmount } = req.body;
    
    // Validar que hay items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay productos en el carrito'
      });
    }

    // Validar método de pago
    if (!['transferencia', 'efectivo'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Método de pago no válido para esta ruta'
      });
    }

    // Validar productos y stock
    let calculatedTotal = 0;
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
      calculatedTotal += itemTotal;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
      });
    }

    // Verificar que el total coincide
    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'El total calculado no coincide con el enviado'
      });
    }

    // Crear la orden
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalAmount: calculatedTotal,
      shippingAddress,
      paymentMethod,
      paymentStatus: 'pending',
      status: 'pending'
    });

    // Para efectivo, no reservar stock hasta confirmar entrega
    // Para transferencia, esperar confirmación de pago
    
    await order.populate('items.product');

    res.json({
      success: true,
      message: 'Orden creada exitosamente',
      orderId: order._id,
      order: order
    });

  } catch (error) {
    console.error('Error creando orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando la orden'
    });
  }
});

// Obtener orden por ID
router.get('/:orderId', protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user.id
    }).populate('items.product');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    res.json({
      success: true,
      order: order
    });
  } catch (error) {
    console.error('Error obteniendo orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo la orden'
    });
  }
});

// Obtener todas las órdenes del usuario
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ user: req.user.id })
      .populate('items.product')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({ user: req.user.id });

    res.json({
      success: true,
      orders: orders,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
        total
      }
    });
  } catch (error) {
    console.error('Error obteniendo órdenes:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo las órdenes'
    });
  }
});

// Actualizar estado de orden (solo para administradores)
router.put('/:orderId/status', protect, async (req, res) => {
  try {
    // Verificar si el usuario es admin (esto depende de cómo manejes los roles)
    // if (!req.user.isAdmin) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'No autorizado'
    //   });
    // }

    const { status, paymentStatus } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    // Actualizar estados
    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    // Si se confirma el pago, reducir stock
    if (paymentStatus === 'approved' && order.paymentStatus !== 'approved') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } }
        );
      }
    }

    await order.save();

    res.json({
      success: true,
      message: 'Estado actualizado correctamente',
      order: order
    });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando el estado'
    });
  }
});

// Cancelar orden
router.put('/:orderId/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user.id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    // Solo se puede cancelar si está pendiente o procesando
    if (!['pending', 'processing'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'No se puede cancelar esta orden'
      });
    }

    order.status = 'cancelled';
    order.paymentStatus = 'cancelled';
    await order.save();

    res.json({
      success: true,
      message: 'Orden cancelada exitosamente'
    });
  } catch (error) {
    console.error('Error cancelando orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelando la orden'
    });
  }
});

module.exports = router;