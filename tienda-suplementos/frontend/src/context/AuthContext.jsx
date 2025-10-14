import { createContext, useContext, useReducer, useEffect } from 'react';
import axios from '../utils/axios';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        isAuthenticated: true,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case 'VERIFY_START':
      return { ...state, loading: true, error: null };
    case 'VERIFY_SUCCESS':
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        isAuthenticated: true,
        error: null
      };
    case 'ADMIN_PIN_PENDING':
      return {
        ...state,
        loading: false,
        pendingAdminPin: true,
        tempToken: action.payload.tempToken,
        user: action.payload.user,
        isAuthenticated: false,
        error: null
      };
    case 'ADMIN_PIN_SUCCESS':
      return {
        ...state,
        loading: false,
        pendingAdminPin: false,
        tempToken: null,
        user: action.payload.user,
        isAuthenticated: true,
        error: null
      };
    case 'VERIFY_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        error: null
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    email: null,
    loading: false,
  error: null,
  pendingAdminPin: false,
  tempToken: null
  });

  // Configurar axios con token
  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [state.token]);

  // Restaurar sesión verificando el token realmente (evita estado "logueado" falso)
  useEffect(() => {
    const boot = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      // Si hay un usuario guardado y es admin, NO restaurar sesión (por seguridad)
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          if (userData.role === 'admin') {
            // Limpiar cualquier token de admin que pueda estar guardado
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return;
          }
        } catch {
          // JSON inválido, limpiar
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return;
        }
      }
      
      if (!token) return; // no token => no intento
      try {
        // Intentar perfil para validar token
        const res = await axios.get('/api/auth/profile');
        if (res.data?.success && res.data.data?.email) {
          const user = {
            id: res.data.data._id,
            email: res.data.data.email,
            firstName: res.data.data.firstName,
            lastName: res.data.data.lastName,
            role: res.data.data.role,
            isEmailVerified: res.data.data.isEmailVerified
          };
          // Verificar nuevamente que no sea admin (por seguridad extra)
          if (user.role === 'admin') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            dispatch({ type: 'LOGOUT' });
            return;
          }
          localStorage.setItem('user', JSON.stringify(user));
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user } });
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch({ type: 'LOGOUT' });
        }
      } catch {
        // Token inválido -> limpiar
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch({ type: 'LOGOUT' });
      }
    };
    boot();
  }, []);

  const login = async (email) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await axios.post('/api/auth/login', { email });
      if (response.data.success) {
        const data = response.data.data;
        if (data.step === 'ADMIN_PIN_REQUIRED') {
          dispatch({ type: 'ADMIN_PIN_PENDING', payload: { tempToken: data.tempToken, user: data.user } });
          return { success: true, adminPinRequired: true };
        } else {
          const { token, user } = data;
          // Solo guardar token en localStorage si NO es admin
          // Los admins deben autenticarse cada vez (por seguridad)
          if (user.role !== 'admin') {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
          }
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user } });
          return { success: true, requiresVerification: false };
        }
      }
    } catch (error) {
      if (error.response?.status === 401) {
        // Usuario no verificado, intentar enviar código
        try {
          await axios.post('/api/auth/send-code', { email });
          dispatch({ type: 'LOGIN_FAILURE', payload: null }); // Reinicia loading
          return { success: true, requiresVerification: true };
        } catch (sendError) {
          dispatch({
            type: 'LOGIN_FAILURE',
            payload: sendError.response?.data?.message || 'Error al enviar código'
          });
          return { success: false, error: sendError.response?.data?.message || 'Error al enviar código' };
        }
      }
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.response?.data?.message || error.message || 'Error de conexión'
      });
      return { success: false, error: error.response?.data?.message || error.message || 'Error de conexión' };
    }
  };

  const verifyCode = async (email, code) => {
    dispatch({ type: 'VERIFY_START' });
    try {
      const response = await axios.post('/api/auth/verify-code', { email, code });
      const data = response.data.data;
      if (data.step === 'ADMIN_PIN_REQUIRED') {
        dispatch({ type: 'ADMIN_PIN_PENDING', payload: { tempToken: data.tempToken, user: data.user } });
        return { success: true, adminPinRequired: true };
      } else {
        const { token, user } = data;
        // Solo guardar token si NO es admin
        if (user.role !== 'admin') {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
        }
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        dispatch({ type: 'VERIFY_SUCCESS', payload: { user } });
        return { success: true };
      }
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Error de conexión';
      dispatch({ type: 'VERIFY_FAILURE', payload: message });
      return { success: false, error: message };
    } finally {
      // Refuerzo: si por alguna razón loading no se resetea, forzar el estado
      setTimeout(() => {
        dispatch({ type: 'VERIFY_FAILURE', payload: null });
      }, 10000);
    }
  };

  const verifyAdminPin = async (pin) => {
    if (!state.tempToken) return { success: false, error: 'No hay sesión temporal' };
    dispatch({ type: 'VERIFY_START' });
    try {
      const response = await axios.post('/api/auth/admin/verify-pin', { tempToken: state.tempToken, pin });
      const { token, user } = response.data.data;
      // NO guardar token de admin en localStorage (por seguridad)
      // El admin debe autenticarse en cada sesión
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      dispatch({ type: 'ADMIN_PIN_SUCCESS', payload: { user } });
      return { success: true };
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Error verificando PIN';
      dispatch({ type: 'VERIFY_FAILURE', payload: message });
      return { success: false, error: message };
    }
  };


  const resendCode = async (email) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      await axios.post('/api/auth/resend-code', { email });
      dispatch({ type: 'CLEAR_ERROR' });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error de conexión';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      verifyCode,
      verifyAdminPin,
      resendCode,
      logout,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
