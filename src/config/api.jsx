// utils/axios.js
import axios from 'axios';

const isLocalhost =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

const api = axios.create({
  baseURL: isLocalhost
    ? 'http://localhost:8000/api'
    : 'https://trezo.cash/api',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// Interceptor pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    // Toujours récupérer le token à chaque requête pour être sûr
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor pour gérer les erreurs 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('❌ Token invalide ou expiré, déconnexion automatique.');
      localStorage.removeItem('auth_token');
      // Redirige uniquement si on n'est pas déjà sur la page login
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
