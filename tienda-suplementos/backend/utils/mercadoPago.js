const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

// Configurar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: {
    timeout: 5000,
    idempotencyKey: 'abc'
  }
});

const preference = new Preference(client);
const payment = new Payment(client);

// Crear preferencia de pago
const createPreference = async (orderData) => {
  try {
    const preferenceData = {
      items: orderData.items.map(item => ({
        id: item.product._id.toString(),
        title: item.product.name,
        description: item.product.description,
        quantity: item.quantity,
        unit_price: item.price,
        currency_id: 'ARS' // Cambiar según tu país
      })),
      payer: {
        name: orderData.user.firstName,
        surname: orderData.user.lastName,
        email: orderData.user.email
      },
      back_urls: {
        success: `${process.env.FRONTEND_URL}/payment/success`,
        failure: `${process.env.FRONTEND_URL}/payment/failure`,
        pending: `${process.env.FRONTEND_URL}/payment/pending`
      },
      auto_return: 'approved',
      external_reference: orderData.orderId,
      notification_url: `${process.env.BACKEND_URL}/api/payments/webhook`
    };

    const response = await preference.create({ body: preferenceData });
    return response;
  } catch (error) {
    console.error('Error creando preferencia:', error);
    throw new Error('Error creando preferencia de pago');
  }
};

// Obtener información de un pago
const getPayment = async (paymentId) => {
  try {
    const response = await payment.get({ id: paymentId });
    return response;
  } catch (error) {
    console.error('Error obteniendo pago:', error);
    throw new Error('Error obteniendo información del pago');
  }
};

// Verificar webhook de Mercado Pago
const verifyWebhook = (req) => {
  const signature = req.headers['x-signature'];
  const id = req.headers['x-request-id'];
  
  if (!signature || !id) {
    return false;
  }
  
  // Aquí implementarías la verificación del webhook
  // usando el MERCADOPAGO_WEBHOOK_SECRET
  return true;
};

module.exports = {
  createPreference,
  getPayment,
  verifyWebhook
};
