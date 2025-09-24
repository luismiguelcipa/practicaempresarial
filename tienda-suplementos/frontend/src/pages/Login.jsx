
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import headerImg from '../assets/images/logo-largo-int-removebg-preview.png';

// Este componente ahora representa el REGISTRO (sign in) con verificación de código
export default function Login() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'code'
  const [message, setMessage] = useState(null);
  const { login, verifyCode, resendCode, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Si venimos redirigidos desde LoginSimple con email y paso de código
  useEffect(() => {
    const st = location.state;
    if (st?.email) {
      setEmail(st.email);
    }
    if (st?.step === 'code') {
      setStep('code');
    }
  }, [location.state]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    const result = await login(email);
    if (result.success && result.requiresVerification) {
      setMessage({ type: 'success', text: 'Código enviado. Revisa tu correo.' });
      setStep('code');
    } else if (result.success && !result.requiresVerification) {
      // Si ya estaba verificado, simplemente loguea
      setMessage({ type: 'success', text: 'Cuenta ya verificada. Sesión iniciada.' });
      setTimeout(() => navigate('/'), 800);
    } else {
      setMessage({ type: 'error', text: result.error || 'Error enviando código.' });
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    const result = await verifyCode(email, code.trim());
    if (result.success) {
      setMessage({ type: 'success', text: '¡Registro verificado e inicio de sesión exitoso!' });
      setTimeout(() => navigate('/'), 1000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Código inválido.' });
    }
  };

  const handleResend = async () => {
    setMessage(null);
    try {
      const r = await resendCode(email);
      if (r.success) {
        setMessage({ type: 'success', text: 'Nuevo código enviado.' });
      } else {
        setMessage({ type: 'error', text: r.error || 'No se pudo reenviar.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error reenviando.' });
    }
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '3rem',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1.25rem' }}>
        <img
          src={headerImg}
          alt="Marca"
          style={{ width: '220px', height: 'auto', objectFit: 'contain' }}
        />
      </div>
      <h1 style={{ margin: '0 0 1.25rem 0', color: '#333', fontWeight: 800, fontSize: '1.8rem', textAlign: 'left' }}>
        {step === 'email' ? 'Regístrate con tu correo' : 'Verifica tu código'}
      </h1>
      {message && (
        <div style={{
          padding: '0.75rem',
          marginBottom: '1rem',
          borderRadius: '4px',
          backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: message.type === 'success' ? '#166534' : '#991b1b'
        }}>
          {message.text}
        </div>
      )}
      {step === 'email' && (
        <form onSubmit={handleEmailSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', color: '#444', fontSize: '1.2rem', fontWeight: 700 }}>
              Ingresa tu Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1.125rem' }}
              placeholder="ejemplo@correo.com"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email}
            style={{ width: '100%', padding: '0.75rem', backgroundColor: loading ? '#9ca3af' : '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Enviando...' : 'Solicitar Código'}
          </button>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={handleCodeSubmit} style={{ marginTop: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="code" style={{ display: 'block', marginBottom: '0.5rem', color: '#444', fontSize: '1.1rem', fontWeight: 600 }}>
              Código de Verificación
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1.125rem', letterSpacing: '0.3em', textAlign: 'center' }}
              placeholder="000000"
              required
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <button type="button" onClick={handleResend} disabled={loading} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: 600 }}>
              Reenviar código
            </button>
            <button type="button" onClick={() => setStep('email')} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer' }}>
              Cambiar email
            </button>
          </div>
          <button
            type="submit"
            disabled={loading || code.length < 4}
            style={{ width: '100%', padding: '0.75rem', backgroundColor: loading ? '#9ca3af' : '#16a34a', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Verificando...' : 'Verificar Código'}
          </button>
        </form>
      )}

      <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '1rem' }}>
        ¿Tienes una cuenta?{' '}
        <button style={{ color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }} onClick={() => navigate('/login')}>
          Inicia sesión
        </button>
      </div>
    </div>
  );
}