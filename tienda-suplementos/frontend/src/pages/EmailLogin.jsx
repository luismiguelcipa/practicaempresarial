import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowRight, Loader } from 'lucide-react';
import Alert from '../components/Alert';

const EmailLogin = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  // Validación de email en tiempo real
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return '';
    }
    if (!emailRegex.test(email)) {
      return 'Por favor ingresa un email válido';
    }
    return '';
  };

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setEmailError(validateEmail(newEmail));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación final
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }

    try {
      setAlert({ show: false, type: '', message: '' });
      const result = await login(email);
      if (result.requiresVerification) {
        // Guardar email en localStorage para recuperación en /verify-email
        localStorage.setItem('pendingEmail', email);
        setAlert({
          show: true,
          type: 'info',
          message: '¡Código enviado! Revisa tu correo.'
        });
        navigate('/verify-email', { state: { email } });
      } else {
        setAlert({
          show: true,
          type: 'success',
          message: '¡Bienvenido de vuelta!'
        });
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (error) {
      console.error('Error:', error);
      setAlert({
        show: true,
        type: 'error',
        message: error.response?.data?.message || error.message || 'Error al iniciar sesión'
      });
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    try {
      setAlert({ show: false, type: '', message: '' });
      const result = await verifyCode(email, code);
      if (result.success) {
        setAlert({
          show: true,
          type: 'success',
          message: '¡Verificación exitosa!'
        });
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (error) {
      setAlert({
        show: true,
        type: 'error',
        message: error.message || 'Error al verificar el código'
      });
    }
  };

  const handleResendCode = async () => {
    try {
      setAlert({ show: false, type: '', message: '' });
      const result = await resendCode(email);
      if (result.success) {
        setAlert({
          show: true,
          type: 'success',
          message: '¡Nuevo código enviado! Revisa tu correo electrónico.'
        });
      }
    } catch (error) {
      setAlert({
        show: true,
        type: 'error',
        message: error.message || 'Error al reenviar el código'
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {alert.show && <Alert type={alert.type} message={alert.message} />}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa tu email para continuar
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`appearance-none rounded-md relative block w-full px-3 py-2 pl-10 border ${
                    emailError ? 'border-red-500' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm`}
                  placeholder="tu@email.com"
                  value={email}
                  onChange={handleEmailChange}
                />
              </div>
              {emailError && (
                <p className="mt-1 text-sm text-red-600">{emailError}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || emailError || !email}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {loading ? (
                  <Loader className="h-5 w-5 text-primary-500 animate-spin" />
                ) : (
                  <ArrowRight className="h-5 w-5 text-primary-500 group-hover:text-primary-400" />
                )}
              </span>
              {loading ? 'Enviando...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailLogin;
