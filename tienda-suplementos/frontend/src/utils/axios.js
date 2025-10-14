import axios from 'axios';

// Configura la URL base de la API desde Vite env o fallback
const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
axios.defaults.baseURL = API_URL;

// Configura los headers por defecto
axios.defaults.headers.post['Content-Type'] = 'application/json';

// Interceptor para agregar el token de autenticación en cada petición
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axios;
