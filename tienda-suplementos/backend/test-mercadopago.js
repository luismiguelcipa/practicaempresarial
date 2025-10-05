require('dotenv').config();
const { MercadoPagoConfig, Preference } = require('mercadopago');

console.log('🔍 Verificando configuración de MercadoPago...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MERCADOPAGO_ACCESS_TOKEN:', process.env.MERCADOPAGO_ACCESS_TOKEN ? `${process.env.MERCADOPAGO_ACCESS_TOKEN.substring(0, 10)}...` : 'NO CONFIGURADO');

// Configurar cliente
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
if (!accessToken) {
  console.error('❌ No hay token de acceso configurado');
  process.exit(1);
}

const client = new MercadoPagoConfig({
  accessToken: accessToken,
  options: {
    timeout: 5000
  }
});

const preference = new Preference(client);

// Crear una preferencia de prueba simple
const testPreference = async () => {
  try {
    console.log('🧪 Creando preferencia de prueba...');
    
    const preferenceData = {
      items: [{
        id: 'test-product',
        title: 'Producto de Prueba',
        description: 'Esto es una prueba',
        quantity: 1,
        unit_price: 100,
        currency_id: 'ARS'
      }],
      payer: {
        name: 'Juan',
        surname: 'Perez',
        email: 'test@example.com'
      },
      back_urls: {
        success: 'http://localhost:5173/payment-success',
        failure: 'http://localhost:5173/payment-failure', 
        pending: 'http://localhost:5173/payment-pending'
      },
      external_reference: 'test-order-123'
    };

    const response = await preference.create({ body: preferenceData });
    console.log('✅ Preferencia creada exitosamente!');
    console.log('ID:', response.id);
    console.log('Init Point:', response.init_point);
    console.log('Sandbox Init Point:', response.sandbox_init_point);
    
  } catch (error) {
    console.error('❌ Error creando preferencia:', error);
    if (error.cause) {
      console.error('Causa:', error.cause);
    }
  }
};

testPreference();