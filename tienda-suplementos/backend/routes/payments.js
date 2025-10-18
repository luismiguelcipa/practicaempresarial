const express = require('express');
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');
const { 
  createWompiTransaction, 
  verifyWompiTransaction, 
  processWompiWebhook,
  getAvailablePaymentMethods 
} = require('../utils/wompi');
const Order = require('../models/Order');
const Product = require('../models/Product');

const router = express.Router();

// Crear transacción con Wompi Widget
router.post('/create-wompi-transaction', protect, async (req, res) => {
  try {
    console.log('📥 Recibiendo datos para transacción Wompi:', req.body);
    const { items, shippingAddress, customerData } = req.body;
    
    if (!items || items.length === 0) {
      console.log('❌ Error: No hay items en el carrito');
      return res.status(400).json({
        success: false,
        message: 'No hay productos en el carrito'
      });
    }

    console.log('✅ Items validados:', items.length, 'productos');
    let totalAmount = 0;
    const orderItems = [];

    console.log('🔍 Procesando items...');
    for (const item of items) {
      console.log('🔍 Procesando item:', item);
      // Ser flexible con el ID del producto
      const productId = item.productId || item.id || item._id;
      console.log('🔍 ProductId extraído:', productId);
      
      let product = null;
      
      // Intentar encontrar el producto, manejando diferentes tipos de ID
      try {
        if (mongoose.Types.ObjectId.isValid(productId)) {
          // Si es un ObjectId válido, usar findById normal
          product = await Product.findById(productId);
        } else {
          // Si no es un ObjectId válido, buscar por otros campos posibles
          console.log('⚠️ ID no es ObjectId válido, buscando por campos alternativos...');
          
          // Intentar buscar por diferentes campos que podrían contener este ID
          product = await Product.findOne({
            $or: [
              { sku: productId },
              { legacy_id: productId },
              { id: productId }
            ]
          });
          
          // Si aún no encontramos nada, intentar convertir a ObjectId si es un número
          if (!product && typeof productId === 'number') {
            // Para productos legacy con IDs numéricos, podrías tener un mapeo
            console.log('🔄 Intentando buscar producto legacy con ID numérico:', productId);
            
            // Buscar todos los productos y ver cuál coincide (método temporal)
            const allProducts = await Product.find({});
            product = allProducts.find(p => 
              p.sku === productId.toString() || 
              p.legacy_id === productId ||
              p.name === item.name
            );
          }
        }
      } catch (error) {
        console.error('❌ Error buscando producto:', error);
      }
      
      console.log('🔍 Producto encontrado:', product ? `${product.name} - $${product.price}` : 'NO ENCONTRADO');
      
      if (!product) {
        console.log('❌ Error: Producto no encontrado -', productId);
        return res.status(400).json({
          success: false,
          message: `Producto ${item.name || productId} no encontrado. Verifica que el producto esté disponible.`
        });
      }

      if (product.stock < item.quantity) {
        console.log('❌ Error: Stock insuficiente -', product.name, 'Stock:', product.stock, 'Solicitado:', item.quantity);
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para ${product.name}`
        });
      }

      totalAmount += product.price * item.quantity;
      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
      });
    }

    console.log('✅ Total calculado:', totalAmount);
    console.log('✅ Items procesados:', orderItems);

    // Mapear shippingAddress para que coincida con el modelo Order
    const mappedShippingAddress = {
      street: shippingAddress.addressLine1 || '',
      city: shippingAddress.city || '',
      state: shippingAddress.region || shippingAddress.state || '',
      zipCode: shippingAddress.postalCode || shippingAddress.zipCode || '',
      country: shippingAddress.country || 'Colombia'
    };

    console.log('🗺️ Dirección mapeada:', mappedShippingAddress);

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalAmount,
      shippingAddress: mappedShippingAddress,
      paymentMethod: 'wompi',
      paymentStatus: 'pending'
    });

    console.log('✅ Orden creada:', order._id);

    console.log('✅ Orden creada:', order._id);

    const reference = `ORDER_${order._id}`;
    console.log('🔗 Referencia generada:', reference);
    
    console.log('🚀 Creando transacción Wompi...');
    const wompiResponse = await createWompiTransaction({
      items: orderItems,
      customerData: customerData || {
        email: req.user.email,
        fullName: `${req.user.firstName} ${req.user.lastName}`,
        phoneNumber: req.user.phoneNumber || '',
        legalId: req.user.legalId || '',
        legalIdType: req.user.legalIdType || 'CC'
      },
      shippingAddress,
      total: totalAmount,
      reference
    });

    console.log('📊 Respuesta de Wompi:', wompiResponse);

    if (!wompiResponse.success) {
      return res.status(500).json({
        success: false,
        message: wompiResponse.error || 'Error creando transacción con Wompi'
      });
    }

    order.wompiReference = reference;
    await order.save();

    res.json({
      success: true,
      orderId: order._id,
      wompiData: wompiResponse.transactionData
    });

  } catch (error) {
    console.error('❌ Error creando transacción Wompi:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error procesando pago',
      error: process.env.NODE_ENV !== 'production' ? error.message : 'Error interno del servidor',
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
});

// Webhook de Wompi
router.post('/wompi-webhook', async (req, res) => {
  try {
    const webhookResult = processWompiWebhook(req);
    
    if (!webhookResult.success) {
      return res.status(400).json({
        success: false,
        message: webhookResult.error
      });
    }

    const { event } = webhookResult;
    
    if (event.event === 'transaction.updated') {
      const transaction = event.data.transaction;
      const reference = transaction.reference;
      
      const order = await Order.findOne({
        wompiReference: reference
      });

      if (!order) {
        console.warn(`Orden no encontrada para referencia: ${reference}`);
        return res.status(404).json({
          success: false,
          message: 'Orden no encontrada'
        });
      }

      order.wompiTransactionId = transaction.id;
      order.paymentStatus = transaction.status;
      
      if (transaction.status === 'APPROVED') {
        order.status = 'processing';
        
        if (order.paymentStatus !== 'APPROVED') {
          for (const item of order.items) {
            await Product.findByIdAndUpdate(
              item.product,
              { $inc: { stock: -item.quantity } }
            );
          }
        }
      } else if (transaction.status === 'DECLINED') {
        order.status = 'cancelled';
      }

      await order.save();
      console.log(`Orden ${order._id} actualizada: ${transaction.status}`);
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

// Obtener estado de pago por orden
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
        totalAmount: order.totalAmount,
        wompiTransactionId: order.wompiTransactionId,
        wompiReference: order.wompiReference
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

// Verificar transacción
router.get('/verify-transaction/:transactionId', protect, async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const verificationResult = await verifyWompiTransaction(transactionId);
    
    if (!verificationResult.success) {
      return res.status(500).json({
        success: false,
        message: verificationResult.error
      });
    }

    const order = await Order.findOne({
      wompiTransactionId: transactionId
    }).populate('items.product');

    res.json({
      success: true,
      transaction: verificationResult.transaction,
      order: order
    });

  } catch (error) {
    console.error('Error verificando transacción:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando transacción'
    });
  }
});

// Métodos de pago disponibles
router.get('/payment-methods', async (req, res) => {
  try {
    const methodsResult = await getAvailablePaymentMethods();
    
    if (!methodsResult.success) {
      return res.status(500).json({
        success: false,
        message: methodsResult.error
      });
    }

    res.json({
      success: true,
      methods: methodsResult.methods
    });

  } catch (error) {
    console.error('Error obteniendo métodos de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo métodos de pago'
    });
  }
});

// Información de configuración (solo desarrollo)
if (process.env.NODE_ENV !== 'production') {
  router.get('/wompi-info', (req, res) => {
    res.json({
      success: true,
      config: {
        publicKey: process.env.WOMPI_PUBLIC_KEY ? 'Configurada' : 'No configurada',
        privateKey: process.env.WOMPI_PRIVATE_KEY ? 'Configurada' : 'No configurada',
        integritySecret: process.env.WOMPI_INTEGRITY_SECRET ? 'Configurada' : 'No configurada',
        baseUrl: process.env.WOMPI_BASE_URL,
        environment: process.env.WOMPI_BASE_URL?.includes('sandbox') ? 'Sandbox' : 'Producción'
      }
    });
  });

  // Endpoint de prueba para debuggear
  router.post('/test-wompi-data', protect, async (req, res) => {
    try {
      console.log('📥 Test endpoint - datos recibidos:', req.body);
      res.json({
        success: true,
        message: 'Datos recibidos correctamente',
        receivedData: req.body,
        user: {
          id: req.user.id,
          email: req.user.email
        }
      });
    } catch (error) {
      console.error('❌ Error en test endpoint:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        stack: error.stack
      });
    }
  });
}

module.exports = router;
