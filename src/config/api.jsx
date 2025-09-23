import axios from 'axios';

// Détermination dynamique de l'URL de base
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const api = axios.create({
  baseURL: isLocalhost
    ? 'http://127.0.0.1:8000/api' // En local
    : 'https://tresocash.com/api', // En ligne
  headers: {
    Accept: 'application/json',
  },
});

// Intercepteur : ajoute le token automatiquement
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur : gestion des erreurs 401 (ex: token expiré)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
