import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

// Request interceptor to attach JWT token if present
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling 401 (optional)
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Optionally redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('username');
      window.location.href = '/settings';
    }
    return Promise.reject(error);
  }
);

export const fetchDashboardData = async (params = {}) => {
  try {
    const response = await api.get('/dashboard-data', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default api;
