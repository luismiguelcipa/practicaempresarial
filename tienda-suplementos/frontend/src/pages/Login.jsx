import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email');
  const [message, setMessage] = useState(null);
  const { login, verifyCode, loading } = useAuth();
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    try {
      setMessage(null);
      await login(email);
      setMessage({ type: 'success', text: 'Código enviado! Revisa tu correo.' });
      setStep('code');
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    try {
      setMessage(null);
      const result = await verifyCode(email, code);
      if (result.success) {
        setMessage({ type: 'success', text: '¡Login exitoso!' });
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '0 auto',
      padding: '2rem',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{
        margin: '0 0 1.5rem 0',
        color: '#333',
        textAlign: 'center'
      }}>
        {step === 'email' ? 'Iniciar Sesión' : 'Verificar Código'}
      </h2>
      
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

      <form onSubmit={step === 'email' ? handleEmailSubmit : handleCodeSubmit}>
        {step === 'email' ? (
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#444'
              }}
            >
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              placeholder="tu@email.com"
              required
            />
          </div>
        ) : (
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="code"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#444'
              }}
            >
              Código de Verificación
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              placeholder="Ingresa el código"
              required
            />
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: loading ? '#9ca3af' : '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading 
            ? 'Cargando...' 
            : step === 'email' 
              ? 'Enviar Código de Verificación' 
              : 'Verificar Código'
          }
        </button>

        {step === 'code' && (
          <button
            type="button"
            onClick={() => setStep('email')}
            style={{
              width: '100%',
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: 'transparent',
              color: '#4f46e5',
              border: '1px solid #4f46e5',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Volver a Email
          </button>
        )}
      </form>
    </div>
  );
}