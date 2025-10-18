const nodemailer = require('nodemailer');

// EMAIL_PROVIDER options:
//  - gmail (recomendado con App Password)
//  - custom (usa EMAIL_HOST/EMAIL_PORT)
//  - ethereal (testing)
const createTransporter = () => {
  const provider = (process.env.EMAIL_PROVIDER || '').toLowerCase();

  if (provider === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // tu correo @gmail.com
        pass: process.env.EMAIL_PASS  // App Password (16 caracteres)
      },
      logger: String(process.env.EMAIL_DEBUG || 'false') === 'true',
      debug: String(process.env.EMAIL_DEBUG || 'false') === 'true'
    });
  }

  if (provider === 'ethereal') {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      logger: String(process.env.EMAIL_DEBUG || 'false') === 'true',
      debug: String(process.env.EMAIL_DEBUG || 'false') === 'true'
    });
  }

  // Fallback a configuración custom
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: String(process.env.EMAIL_SECURE || 'false') === 'true', // true si usas 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    logger: String(process.env.EMAIL_DEBUG || 'false') === 'true',
    debug: String(process.env.EMAIL_DEBUG || 'false') === 'true'
  });
};

const sendVerificationEmail = async (email, verificationCode) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'Verificación de Email - SportSupps',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">¡Bienvenido a SportSupps!</h2>
        <p>Gracias por registrarte en nuestra tienda de suplementos deportivos.</p>
        <p>Para completar tu registro, por favor ingresa el siguiente código de verificación:</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #3b82f6; font-size: 32px; margin: 0; letter-spacing: 5px;">${verificationCode}</h1>
        </div>
        <p>Este código expirará en 10 minutos.</p>
        <p>Si no solicitaste este registro, puedes ignorar este email.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de verificación enviado a:', email, {
      messageId: info?.messageId,
      accepted: info?.accepted,
      rejected: info?.rejected
    });
    return info;
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    throw new Error(`Error enviando email de verificación: ${error.message || error}`);
  }
};

// Enviar notificación de nueva orden al administrador
const sendNewOrderNotificationToAdmin = async (order, userInfo) => {
  const transporter = createTransporter();
  
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  
  const orderItemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.product?.name || 'Producto eliminado'}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        $${item.price.toLocaleString('es-CO')}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        $${(item.quantity * item.price).toLocaleString('es-CO')}
      </td>
    </tr>
  `).join('');

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: adminEmail,
    subject: `🛒 Nueva Orden Recibida - #${order.orderNumber || order._id.toString().slice(-8).toUpperCase()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
        <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">🛒 Nueva Orden Recibida</h1>
        </div>
        
        <div style="padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Información de la Orden</h2>
            <p><strong>Número de Orden:</strong> #${order.orderNumber || order._id.toString().slice(-8).toUpperCase()}</p>
            <p><strong>Total:</strong> $${order.totalAmount.toLocaleString('es-CO')}</p>
            <p><strong>Método de Pago:</strong> ${order.paymentMethod}</p>
            <p><strong>Estado de Pago:</strong> ${order.paymentStatus}</p>
            <p><strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleDateString('es-CO', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>

          <div style="margin-bottom: 20px;">
            <h2 style="color: #333;">Información del Cliente</h2>
            <p><strong>Email:</strong> ${userInfo.email}</p>
            <p><strong>Nombre:</strong> ${userInfo.firstName} ${userInfo.lastName}</p>
            ${userInfo.phone ? `<p><strong>Teléfono:</strong> ${userInfo.phone}</p>` : ''}
          </div>

          ${order.shippingAddress ? `
          <div style="margin-bottom: 20px;">
            <h2 style="color: #333;">Dirección de Envío</h2>
            <p><strong>Nombre:</strong> ${order.shippingAddress.fullName}</p>
            <p><strong>Teléfono:</strong> ${order.shippingAddress.phoneNumber}</p>
            <p><strong>Dirección:</strong> ${order.shippingAddress.street}</p>
            ${order.shippingAddress.addressLine2 ? `<p><strong>Complemento:</strong> ${order.shippingAddress.addressLine2}</p>` : ''}
            <p><strong>Ciudad:</strong> ${order.shippingAddress.city}, ${order.shippingAddress.region}</p>
            <p><strong>Código Postal:</strong> ${order.shippingAddress.zipCode || 'N/A'}</p>
          </div>
          ` : ''}

          <div>
            <h2 style="color: #333;">Productos Ordenados</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Producto</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Cantidad</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Precio Unit.</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${orderItemsHtml}
                <tr style="background-color: #f8f9fa; font-weight: bold;">
                  <td colspan="3" style="padding: 15px; text-align: right; border-top: 2px solid #ddd;">TOTAL:</td>
                  <td style="padding: 15px; text-align: right; border-top: 2px solid #ddd;">$${order.totalAmount.toLocaleString('es-CO')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="margin-top: 30px; padding: 15px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
            <p style="margin: 0; color: #856404;"><strong>⚠️ Acción Requerida:</strong> Revisa esta orden y procesa el envío cuando sea apropiado.</p>
          </div>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Notificación de orden enviada al admin:', adminEmail, {
      orderId: order._id,
      messageId: info?.messageId
    });
    return info;
  } catch (error) {
    console.error('❌ Error enviando notificación al admin:', error);
    throw new Error(`Error enviando notificación de orden: ${error.message || error}`);
  }
};

// Enviar confirmación de orden al cliente
const sendOrderConfirmationToCustomer = async (order, userInfo) => {
  const transporter = createTransporter();
  
  const orderItemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.product?.name || 'Producto eliminado'}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        $${item.price.toLocaleString('es-CO')}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        $${(item.quantity * item.price).toLocaleString('es-CO')}
      </td>
    </tr>
  `).join('');

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: userInfo.email,
    subject: `✅ Confirmación de Orden - SportSupps #${order.orderNumber || order._id.toString().slice(-8).toUpperCase()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
        <div style="background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">✅ ¡Orden Confirmada!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Gracias por tu compra en SportSupps</p>
        </div>
        
        <div style="padding: 20px;">
          <p>Hola <strong>${userInfo.firstName}</strong>,</p>
          <p>Hemos recibido tu orden y la estamos procesando. Te notificaremos cuando sea enviada.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Detalles de tu Orden</h2>
            <p><strong>Número de Orden:</strong> #${order.orderNumber || order._id.toString().slice(-8).toUpperCase()}</p>
            <p><strong>Total:</strong> $${order.totalAmount.toLocaleString('es-CO')}</p>
            <p><strong>Método de Pago:</strong> ${order.paymentMethod}</p>
            <p><strong>Estado:</strong> ${order.paymentStatus === 'pending' ? 'Pendiente de pago' : 'Pagado'}</p>
            <p><strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleDateString('es-CO', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric'
            })}</p>
          </div>

          <div style="margin: 20px 0;">
            <h2 style="color: #333;">Productos Ordenados</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Producto</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">Cant.</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Precio</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${orderItemsHtml}
                <tr style="font-weight: bold; background-color: #f8f9fa;">
                  <td colspan="3" style="padding: 15px; text-align: right; border-top: 1px solid #ddd;">TOTAL:</td>
                  <td style="padding: 15px; text-align: right; border-top: 1px solid #ddd;">$${order.totalAmount.toLocaleString('es-CO')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          ${order.paymentMethod === 'transferencia' ? `
          <div style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
            <h3 style="margin-top: 0; color: #856404;">💳 Instrucciones de Pago</h3>
            <p style="margin: 0; color: #856404;">Has elegido pago por transferencia. Te contactaremos pronto con los detalles bancarios para completar el pago.</p>
          </div>
          ` : ''}

          <div style="margin: 30px 0; text-align: center;">
            <p>¿Tienes preguntas sobre tu orden?</p>
            <p>Contáctanos: <strong>${process.env.EMAIL_USER}</strong></p>
          </div>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Confirmación de orden enviada al cliente:', userInfo.email, {
      orderId: order._id,
      messageId: info?.messageId
    });
    return info;
  } catch (error) {
    console.error('❌ Error enviando confirmación al cliente:', error);
    throw new Error(`Error enviando confirmación de orden: ${error.message || error}`);
  }
};

module.exports = { 
  sendVerificationEmail,
  sendNewOrderNotificationToAdmin,
  sendOrderConfirmationToCustomer
};
// Export para debug
module.exports.verifyTransport = async () => {
  const transporter = createTransporter();
  return transporter.verify();
};