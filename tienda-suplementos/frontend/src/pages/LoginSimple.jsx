import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import headerImg from '../assets/images/logo-largo-int-removebg-preview.png';

export default function LoginSimple() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const { login, loading, pendingAdminPin, verifyAdminPin, error, clearError } = useAuth();
  const [pin, setPin] = useState('');
  const [pinMessage, setPinMessage] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    clearError?.();
    const result = await login(email);
    if (result.success && result.adminPinRequired) {
      setMessage({ type: 'info', text: 'Ingresa tu PIN de administrador' });
      return;
    }
    if (result.success && !result.requiresVerification) {
      setMessage({ type: 'success', text: 'Inicio de sesión exitoso' });
      setTimeout(() => navigate('/'), 800);
    } else if (result.success && result.requiresVerification) {
      navigate('/sign-in', { state: { email, step: 'code', from: location.pathname } });
    } else if (result.error) {
      setMessage({ type: 'error', text: result.error });
    }
  };

  const handleVerifyPin = async (e) => {
    e.preventDefault();
    setPinMessage(null);
    const res = await verifyAdminPin(pin);
    if (res.success) {
      setPinMessage({ type: 'success', text: 'PIN correcto. Sesión iniciada.' });
      setTimeout(() => navigate('/'), 600);
    } else {
      setPinMessage({ type: 'error', text: res.error || 'PIN inválido' });
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
        Inicia sesión con tu correo electrónico
      </h1>

      {message && (
        <div style={{ padding: '0.75rem', marginBottom: '1rem', borderRadius: '4px', backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#991b1b' }}>
          {message.text}
        </div>
      )}

      {/* Paso 1: Email */}
      {!pendingAdminPin && (
        <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', color: '#444', fontSize: '1.1rem', fontWeight: 600 }}>Email</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1.125rem' }} placeholder="ejemplo@correo.com" required />
        </div>

        <button type="submit" disabled={loading || !email} style={{ width: '100%', padding: '0.75rem', backgroundColor: loading ? '#9ca3af' : '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Cargando...' : 'Iniciar Sesión'}
        </button>

        <div style={{ marginTop: '1rem', textAlign: 'center', color: '#444' }}>
          ¿No tienes una cuenta?{' '}
          <Link to="/sign-in" style={{ color: '#4f46e5', fontWeight: 600 }}>Regístrate</Link>
        </div>
        </form>
      )}

      {/* Paso 2: PIN Admin */}
      {pendingAdminPin && (
        <form onSubmit={handleVerifyPin} style={{ marginTop: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="pin" style={{ display: 'block', marginBottom: '0.5rem', color: '#444', fontSize: '1.05rem', fontWeight: 600 }}>PIN Administrador</label>
            <input
              type="password"
              id="pin"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={10}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g,''))}
              style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1.2rem', letterSpacing: '4px', textAlign: 'center' }}
              placeholder="••••"
              required
            />
            <small style={{ color: '#666' }}>Introduce tu PIN de 4 a 10 dígitos.</small>
          </div>
          {pinMessage && (
            <div style={{ padding: '0.6rem', marginBottom: '0.75rem', borderRadius: '4px', backgroundColor: pinMessage.type === 'success' ? '#dcfce7' : '#fee2e2', color: pinMessage.type === 'success' ? '#166534' : '#991b1b' }}>
              {pinMessage.text}
            </div>
          )}
          {error && (
            <div style={{ padding: '0.6rem', marginBottom: '0.75rem', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#991b1b' }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading || pin.length < 4} style={{ width: '100%', padding: '0.75rem', backgroundColor: loading ? '#9ca3af' : '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Validando...' : 'Verificar PIN'}
          </button>
          <button type="button" onClick={() => { setPin(''); setPinMessage(null); }} style={{ marginTop: '0.75rem', background: 'transparent', color: '#4f46e5', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            Reintentar
          </button>
        </form>
      )}
    </div>
  );
}
