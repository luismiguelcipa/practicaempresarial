const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
// Forzar que .env sobrescriba variables de entorno existentes (evita usar tokens viejos del SO)
require('dotenv').config({ override: true });

const app = express();

// Middleware de seguridad
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
});
app.use('/api/', limiter);

// CORS (permitir cualquier puerto localhost en desarrollo)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isLocalDev = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin);
    if (process.env.NODE_ENV !== 'production' && isLocalDev) {
      return callback(null, true);
    }
    const allowed = ['https://tu-dominio.com'];
    if (allowed.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (imágenes subidas)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Log inicial (seguro) sobre configuración de MercadoPago
(() => {
  const mode = (process.env.MP_MODE || (process.env.NODE_ENV === 'production' ? 'prod' : 'test')).toLowerCase();
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN || (process.env.NODE_ENV === 'production' ? process.env.MERCADOPAGO_ACCESS_TOKEN_PROD : undefined);
  const label = token?.startsWith('TEST-') ? 'TEST' : token?.startsWith('APP_USR-') ? 'APP_USR' : token ? 'CUSTOM' : 'NONE';
  console.log(`[Startup] MP_MODE=${mode} | TOKEN_LABEL=${label}`);
})();

// Rutas
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const paymentsRoutes = require('./routes/payments');
const ordersRoutes = require('./routes/orders');
const usersRoutes = require('./routes/users');

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/users', usersRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ message: 'Servidor funcionando correctamente' });
});

// Ruta de prueba de correo (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  const { sendVerificationEmail, verifyTransport } = require('./utils/emailService');
  const User = require('./models/User');
  app.post('/api/debug/email', async (req, res) => {
    try {
      const to = req.body?.to || process.env.TEST_EMAIL || process.env.EMAIL_USER;
      const code = '123456';
      const info = await sendVerificationEmail(to, code);
      res.json({ success: true, message: `Email enviado a ${to}`, info });
    } catch (err) {
      console.error('Error debug email:', err);
      res.status(500).json({ success: false, message: err.message || 'Error enviando correo' });
    }
  });

  app.get('/api/debug/email-config', (req, res) => {
    res.json({
      EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
      EMAIL_USER: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.slice(0,3)}***` : null,
      EMAIL_FROM: process.env.EMAIL_FROM,
      EMAIL_HOST: process.env.EMAIL_HOST,
      EMAIL_PORT: process.env.EMAIL_PORT,
      EMAIL_SECURE: process.env.EMAIL_SECURE,
    });
  });

  app.get('/api/debug/email-verify', async (req, res) => {
    try {
      const ok = await verifyTransport();
      res.json({ success: true, verify: ok });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message || String(err) });
    }
  });

  // Ruta para inspeccionar el código de verificación almacenado (solo dev)
  app.get('/api/debug/peek-code', async (req, res) => {
    try {
      const email = req.query.email;
      if (!email) return res.status(400).json({ success: false, message: 'email requerido' });
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      res.json({
        success: true,
        email: user.email,
        code: user.emailVerificationCode,
        expires: user.emailVerificationExpires
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message || String(err) });
    }
  });
}

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Conectado a MongoDB');
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });
})
.catch((error) => {
  console.error('Error conectando a MongoDB:', error);
  process.exit(1);
});
