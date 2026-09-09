import axios from 'axios';

// Create an axios instance with base URL from environment variable
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

// Function to fetch dashboard data
export const fetchDashboardData = async (params = {}) => {
  try {
    const response = await api.get('/dashboard-data', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

export default api;
