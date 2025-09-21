import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import headerImg from '../assets/images/foooter.jpg';

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
      maxWidth: '600px',
      margin: '0 auto',
      padding: '3rem',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      {/* Imagen superior estilo cabecera */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <img
          src={headerImg}
          alt="Marca"
          style={{
            width: '140px',
            height: 'auto',
            objectFit: 'contain',
            borderRadius: '6px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
          }}
        />
      </div>
      <h1 style={{
        margin: '0 0 1.5rem 0',
        color: '#333',
        fontWeight: 800,
        fontSize: '1.8rem',
        textAlign: 'center'
      }}>
        {step === 'email' ? 'REGISTRATE' : 'Verificar Código'}
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

      <form onSubmit={step === 'email' ? handleEmailSubmit : handleCodeSubmit}>
        {step === 'email' ? (
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#444',
                fontSize: '1.2rem',
                fontWeight: 700
              }}
            >
              Ingresa tu Email
            </label>  <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#444',
                fontSize: '1rem',
                fontWeight: 400
              }}
            >
              Te enviaremos un código de verificación
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
                fontSize: '1.125rem'
              }}
              placeholder="ejemplo@correo.com"
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
                fontSize: '1.125rem'
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
              ? 'Solicita Tu Código' 
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