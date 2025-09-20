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
    error: null
  });

  // Configurar axios con token
  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [state.token]);

  const login = async (email) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await axios.post('/api/auth/login', { email });
      if (response.data.success) {
        const { token, user } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user }
        });
        return { success: true, requiresVerification: false };
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
      const { token, user } = response.data.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      dispatch({
        type: 'VERIFY_SUCCESS',
        payload: { user }
      });
      return { success: true };
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
