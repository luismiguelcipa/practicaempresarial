const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/emailService');
const { generateVerificationCode } = require('../utils/generateCode');
const { protect } = require('../middleware/auth');
const { validateEmail, validateVerifyEmail } = require('../middleware/validation');
const { loginLimiter, codeLimiter } = require('../middleware/rateLimiter');
// (Revertido) TOTP eliminado
const bcrypt = require('bcryptjs');

// Login directo para usuarios verificados
router.post('/login', validateEmail, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email, isEmailVerified: true });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o no verificado'
      });
    }

    // Si admin con PIN habilitado -> no dar token final todavía
    if (user.role === 'admin' && user.adminPinEnabled && user.adminPinHash) {
      const tempToken = jwt.sign(
        { id: user._id, email: user.email, role: user.role, pendingAdminPin: true },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.json({
        success: true,
        message: 'Login preliminar. Falta PIN administrador',
        data: {
          step: 'ADMIN_PIN_REQUIRED',
          tempToken,
          user: { id: user._id, email: user.email, role: user.role }
        }
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
            lastName: user.lastName,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Enviar código de verificación (login/registro)
router.post('/send-code', codeLimiter, validateEmail, async (req, res) => {
  try {
    const { email } = req.body;

    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000);

    let user = await User.findOne({ email });
    
    if (user) {
      user.emailVerificationCode = verificationCode;
      user.emailVerificationExpires = verificationExpires;
      await user.save();
    } else {
      user = await User.create({
        email,
        emailVerificationCode: verificationCode,
        emailVerificationExpires: verificationExpires
      });
    }

    await sendVerificationEmail(email, verificationCode);

    res.json({
      success: true,
      message: 'Código de verificación enviado a tu email',
      data: { email: user.email }
    });
  } catch (error) {
    console.error('Error enviando código:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Verificar código y hacer login
router.post('/verify-code', loginLimiter, validateVerifyEmail, async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({
      email,
      emailVerificationCode: code,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Código inválido o expirado'
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    user.lastLogin = new Date();
    await user.save();

    // Si es admin y tiene PIN habilitado, devolver paso intermedio (sin token final todavía)
    if (user.role === 'admin' && user.adminPinEnabled && user.adminPinHash) {
      const tempToken = jwt.sign(
        { id: user._id, email: user.email, role: user.role, pendingAdminPin: true },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.json({
        success: true,
        message: 'Código verificado. Falta PIN administrador',
        data: {
          step: 'ADMIN_PIN_REQUIRED',
          tempToken,
          user: { id: user._id, email: user.email, role: user.role }
        }
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Error verificando código:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});


// Reenviar código de verificación
router.post('/resend-code', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email no encontrado'
      });
    }

    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    await sendVerificationEmail(email, verificationCode);

    res.json({
      success: true,
      message: 'Código de verificación reenviado'
    });
  } catch (error) {
    console.error('Error reenviando código:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener perfil del usuario (ruta protegida)
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar perfil del usuario (ruta protegida)
router.put('/profile', protect, async (req, res) => {
  try {
    const { firstName, lastName, phone, addresses } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, phone, addresses },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: user
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
// ================== ADMIN PIN EXTRA SECURITY ==================

// Establecer (o cambiar) PIN admin (requiere estar logueado con token normal y ser admin)
router.post('/admin/set-pin', protect, async (req, res) => {
  try {
    const { pin } = req.body; // pin texto plano 6-10 dígitos
    if (!pin || !/^\d{4,10}$/.test(pin)) {
      return res.status(400).json({ success: false, message: 'PIN inválido (4-10 dígitos numéricos)' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    if (user.role !== 'admin') return res.status(403).json({ success: false, message: 'Solo admin' });
    const salt = await bcrypt.genSalt(10);
    user.adminPinHash = await bcrypt.hash(pin, salt);
    user.adminPinEnabled = true;
    // reset intentos/lock
    user.adminPinAttempts = 0;
    user.adminPinLockedUntil = null;
    await user.save();
    res.json({ success: true, message: 'PIN configurado' });
  } catch (err) {
    console.error('Error set-pin:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Verificar PIN después del paso de código (usa tempToken emitido en verify-code)
router.post('/admin/verify-pin', async (req, res) => {
  try {
    const { tempToken, pin } = req.body;
    if (!tempToken || !pin) return res.status(400).json({ success: false, message: 'Datos incompletos' });
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Token temporal inválido o expirado' });
    }
    if (!decoded.pendingAdminPin) return res.status(400).json({ success: false, message: 'Estado PIN no pendiente' });
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    if (!(user.role === 'admin' && user.adminPinEnabled && user.adminPinHash)) {
      return res.status(400).json({ success: false, message: 'PIN no requerido' });
    }
    // Verificar bloqueo
    if (user.adminPinLockedUntil && user.adminPinLockedUntil > new Date()) {
      const remainingMs = user.adminPinLockedUntil.getTime() - Date.now();
      return res.status(423).json({
        success: false,
        message: 'PIN bloqueado temporalmente',
        data: { lockedUntil: user.adminPinLockedUntil, remainingMs }
      });
    }
    const ok = await bcrypt.compare(pin, user.adminPinHash);
    if (!ok) {
      user.adminPinAttempts = (user.adminPinAttempts || 0) + 1;
      const MAX_ATTEMPTS = 5;
      if (user.adminPinAttempts >= MAX_ATTEMPTS) {
        // Bloquear por 15 minutos
        const LOCK_MINUTES = 15;
        user.adminPinLockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
        await user.save();
        return res.status(423).json({
          success: false,
          message: `PIN bloqueado por demasiados intentos. Espera ${LOCK_MINUTES} minutos`,
          data: { lockedUntil: user.adminPinLockedUntil }
        });
      }
      await user.save();
      return res.status(400).json({ success: false, message: 'PIN incorrecto', data: { attempts: user.adminPinAttempts } });
    }
    // éxito -> reset intentos y lock
    user.adminPinAttempts = 0;
    user.adminPinLockedUntil = null;
    await user.save();
    const finalToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token: finalToken,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin,
          role: user.role
        }
      }
    });
  } catch (err) {
    console.error('Error verify-pin:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Cambiar PIN (requiere token normal admin) -> oldPin + newPin
router.post('/admin/change-pin', protect, async (req, res) => {
  try {
    const { oldPin, newPin } = req.body;
    if (!oldPin || !newPin) return res.status(400).json({ success: false, message: 'Datos incompletos' });
    if (!/^\d{4,10}$/.test(newPin)) return res.status(400).json({ success: false, message: 'Nuevo PIN inválido (4-10 dígitos)' });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    if (user.role !== 'admin') return res.status(403).json({ success: false, message: 'Solo admin' });
    if (!(user.adminPinEnabled && user.adminPinHash)) return res.status(400).json({ success: false, message: 'PIN no configurado' });
    const ok = await bcrypt.compare(oldPin, user.adminPinHash);
    if (!ok) return res.status(400).json({ success: false, message: 'PIN actual incorrecto' });
    const salt = await bcrypt.genSalt(10);
    user.adminPinHash = await bcrypt.hash(newPin, salt);
    user.adminPinAttempts = 0;
    user.adminPinLockedUntil = null;
    await user.save();
    res.json({ success: true, message: 'PIN actualizado' });
  } catch (err) {
    console.error('Error change-pin:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Deshabilitar PIN (requiere token normal admin) -> requiere pin
router.post('/admin/disable-pin', protect, async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ success: false, message: 'PIN requerido' });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    if (user.role !== 'admin') return res.status(403).json({ success: false, message: 'Solo admin' });
    if (!(user.adminPinEnabled && user.adminPinHash)) return res.status(400).json({ success: false, message: 'PIN no configurado' });
    const ok = await bcrypt.compare(pin, user.adminPinHash);
    if (!ok) return res.status(400).json({ success: false, message: 'PIN incorrecto' });
    user.adminPinHash = null;
    user.adminPinEnabled = false;
    user.adminPinAttempts = 0;
    user.adminPinLockedUntil = null;
    await user.save();
    res.json({ success: true, message: 'PIN deshabilitado' });
  } catch (err) {
    console.error('Error disable-pin:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});