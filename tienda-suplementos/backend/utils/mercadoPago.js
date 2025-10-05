const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

// Configurar Mercado Pago
// Nota: En algunas regiones Mercado Pago eliminó tokens TEST-. El APP_USR puede
// operar tanto en pruebas como en producción dependiendo de qué cuentas uses.
// Estrategia:
// 1) Usa MERCADOPAGO_ACCESS_TOKEN si está presente (test o app_usr)
// 2) En producción, si no hay el anterior, usa MERCADOPAGO_ACCESS_TOKEN_PROD
// 3) Logs claros del modo percibido (MP_MODE/test/prod) sin exponer secretos
const getAccessToken = () => {
  const explicit = process.env.MERCADOPAGO_ACCESS_TOKEN; // puede ser TEST- o APP_USR-
  const prod = process.env.MERCADOPAGO_ACCESS_TOKEN_PROD;
  const mpMode = (process.env.MP_MODE || '').toLowerCase(); // 'test' | 'prod'
  const isProdEnv = process.env.NODE_ENV === 'production';

  // Selección de token
  const token = explicit || (isProdEnv ? prod : explicit || prod);

  // Etiqueta del token (no imprimimos el token completo)
  const tokenLabel = token?.startsWith('TEST-') ? 'TEST' : (token?.startsWith('APP_USR-') ? 'APP_USR' : (token ? 'CUSTOM' : 'NONE'));

  // Determinar "modo" informativo
  const inferredMode = mpMode || (isProdEnv ? 'prod' : 'test');
  if (inferredMode === 'prod') {
    console.log(`🏭 MP MODO: PRODUCCIÓN | TOKEN: ${tokenLabel}`);
  } else {
    console.log(`🧪 MP MODO: PRUEBA | TOKEN: ${tokenLabel}`);
  }

  return token;
};

const client = new MercadoPagoConfig({
  accessToken: getAccessToken(),
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
    // Verificar si estamos en modo real o demo
    const accessToken = getAccessToken();
    
    // Si no hay token configurado, usar modo demo
    if (!accessToken) {
      console.log('🎭 MODO DEMO - No hay token configurado, simulando MercadoPago');
      return {
        id: `demo-${Date.now()}`,
        init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=demo-preference',
        sandbox_init_point: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=demo-preference'
      };
    }

    // Determinar si es modo test o producción (flexible por región)
    const mpMode = (process.env.MP_MODE || '').toLowerCase();
    const isProdEnv = process.env.NODE_ENV === 'production';
    const tokenLooksTest = accessToken?.startsWith('TEST-');
    const tokenLooksProd = accessToken?.startsWith('APP_USR-');
    const isTestMode = mpMode ? mpMode === 'test' : !isProdEnv || tokenLooksTest;
    console.log(isTestMode
      ? `🧪 MODO TEST - Creando preferencia (token=${tokenLooksTest ? 'TEST' : tokenLooksProd ? 'APP_USR' : 'CUSTOM'})`
      : `✅ MODO PRODUCCIÓN - Creando preferencia (token=${tokenLooksProd ? 'APP_USR' : tokenLooksTest ? 'TEST' : 'CUSTOM'})`);

    const currencyId = process.env.MP_CURRENCY_ID || 'COP';
    const preferenceData = {
      items: orderData.items.map(item => ({
        id: item.product._id.toString(),
        title: item.product.name,
        description: item.product.description,
        quantity: item.quantity,
        unit_price: item.price,
        currency_id: currencyId // Configurable por entorno (COP por defecto)
      })),
      payer: {
        name: orderData.user.firstName,
        surname: orderData.user.lastName,
        email: orderData.user.email
      },
      back_urls: {
        success: process.env.SUCCESS_URL || `${process.env.FRONTEND_URL}/payment-success`,
        failure: process.env.FAILURE_URL || `${process.env.FRONTEND_URL}/payment-failure`, 
        pending: process.env.PENDING_URL || `${process.env.FRONTEND_URL}/payment-pending`
      },
      // auto_return: 'approved', // Temporalmente comentado
      external_reference: orderData.orderId,
      payment_methods: {
        // Nota: En algunas regiones (p. ej., MCO) NO se permite excluir 'account_money'.
        // Si quieres limitar métodos, usa IDs válidos según la API de tu país.
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 12 // Permitir hasta 12 cuotas
      },
      notification_url: process.env.NODE_ENV === 'production' && process.env.WEBHOOK_URL 
        ? process.env.WEBHOOK_URL 
        : `${process.env.BACKEND_URL}/api/payments/webhook`
    };

    console.log(`🧾 MP Preference currency=${currencyId} items=${preferenceData.items.length}`);
    const response = await preference.create({ body: preferenceData });
    const ip = response?.init_point || response?.sandbox_init_point;
    if (ip) {
      try {
        const url = new URL(ip);
        console.log(`🔗 MP init_point host=${url.host} path=${url.pathname}`);
      } catch (_) {
        console.log(`🔗 MP init_point=${ip}`);
      }
    }
    console.log(`✅ MP preference created id=${response?.id || 'n/a'}`);
    return response;
  } catch (error) {
    console.error('Error creando preferencia:', error?.message || error);
    if (error?.cause) console.error('Cause:', JSON.stringify(error.cause));
    if (error?.error) console.error('Error detail:', JSON.stringify(error.error));
    // Propagar error real para que la ruta responda 500 y el front lo vea
    return {
      error: error?.message || 'Error al crear la preferencia',
      cause: error?.cause,
      detail: error?.error
    };
  }
};

// Crear pago con tarjeta (Checkout API / Bricks)
const createCardPayment = async ({
  token,
  installments,
  payment_method_id,
  issuer_id,
  payer,
  amount,
  description,
  orderId
}) => {
  try {
    const currencyId = process.env.MP_CURRENCY_ID || 'COP';
    const body = {
      transaction_amount: Number(amount),
      token,
      description: description || `Order ${orderId}`,
      installments: Number(installments) || 1,
      payment_method_id,
      issuer_id,
      payer: {
        email: payer?.email,
        identification: payer?.identification
      },
      external_reference: orderId,
      binary_mode: false,
      statement_descriptor: (process.env.STATEMENT_DESCRIPTOR || 'TIENDA')?.substring(0, 22),
      metadata: { currency_id: currencyId }
    };

    console.log(`💳 MP card payment: amount=${body.transaction_amount} currency=${currencyId} method=${payment_method_id}`);
    const resp = await payment.create({ body });
    console.log(`✅ MP payment created id=${resp?.id} status=${resp?.status}`);
    return resp;
  } catch (error) {
    console.error('Error creando pago con tarjeta:', error?.message || error);
    if (error?.cause) console.error('Cause:', JSON.stringify(error.cause));
    if (error?.error) console.error('Error detail:', JSON.stringify(error.error));
    return {
      error: error?.message || 'Error al crear el pago con tarjeta',
      cause: error?.cause,
      detail: error?.error
    };
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
  createCardPayment,
  getPayment,
  verifyWebhook
};
