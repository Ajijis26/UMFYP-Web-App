// api.js
import axios from 'axios';

// Create a global axios instance
const apiClient = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true, // Include cookies for authentication
});

// Add an interceptor for handling errors globally
apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response || error.message);
    return Promise.reject(error.response?.data?.error || error.message);
  }
);

export const registerUser = async (userData) => {
  return apiClient.post('/api/register', userData);
};

export const loginUser = async (userData) => {
  return apiClient.post('/api/login', userData);
};

// Additional methods
export const getUserDetails = (userId) => apiClient.get(`/api/users/${userId}`);
export const updateUserDetails = (userId, userData) => apiClient.put(`/api/users/${userId}`, userData);

export default apiClient; // Export the axios instance for reuse