require('dotenv').config({ path: './.env' });
const express = require('express');

const app = express();

// Middleware básico
app.use(express.json());

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ message: 'Servidor funcionando correctamente' });
});

// Ruta de prueba de email
app.post('/api/auth/send-code', (req, res) => {
  const { email } = req.body;
  console.log('Email recibido:', email);
  res.json({ 
    success: true, 
    message: 'Código de verificación enviado a tu email',
    data: { email }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de prueba corriendo en puerto ${PORT}`);
  console.log(`📧 Email configurado: ${process.env.EMAIL_USER}`);
});
