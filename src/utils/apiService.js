// services/apiService.js
import api from '../config/api';

class ApiService {
  // Méthodes d'authentification
  async signIn(email, password) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response.data;
  }

  async signUp(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  }

  async signOut() {
    const response = await api.post('/auth/logout');
    localStorage.removeItem('auth_token');
    return response.data;
  }

  // Méthodes CRUD génériques
  async from(table) {
    this.currentTable = table;
    return this;
  }

  async select(columns = '*') {
    const response = await api.get(`/${this.currentTable}`, {
      params: { columns }
    });
    return { data: response.data, error: null };
  }

  async insert(data) {
    const response = await api.post(`/${this.currentTable}`, data);
    return { data: [response.data], error: null };
  }

  async update(values) {
    const response = await api.put(`/${this.currentTable}`, values);
    return { data: [response.data], error: null };
  }

  async delete() {
    const response = await api.delete(`/${this.currentTable}`);
    return { data: null, error: null };
  }

  async eq(column, value) {
    const response = await api.get(`/${this.currentTable}`, {
      params: { [column]: value }
    });
    return { data: response.data, error: null };
  }

  async single() {
    const response = await api.get(`/${this.currentTable}`);
    return { data: response.data[0] || null, error: null };
  }

  // Méthodes spécifiques
async getProfile(userId) {
  try {
    if (userId === 'current') {
      const response = await api.get('/auth/user');
      return { data: response.data, error: null };
    }
    // Logique pour d'autres IDs
  } catch (error) {
    console.error('API Service error:', error);
    return { data: null, error: error.message };
  }
}

  async getProjects() {
    const response = await api.get('/projects');
    return { data: response.data, error: null };
  }

  // ... autres méthodes spécifiques selon vos besoins
}

export const apiService = new ApiService();