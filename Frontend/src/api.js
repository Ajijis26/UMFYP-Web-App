// api.js
import axios from 'axios';

// Create a global axios instance
const apiClient = axios.create({
  baseURL: process.env.VITE_API_BASE_URL || 'http://localhost:3000',
  withCredentials: true, // Include cookies for authentication
});

// Add an interceptor for handling errors globally
apiClient.interceptors.response.use(
  response => response,
  error => {
    const customError = {
      message: error.response?.data?.error || error.message,
      status: error.response?.status,
    };
    console.error('API Error:', customError);
    return Promise.reject(customError);
  }
);

// Define API methods
export const registerUser = async (userData) => apiClient.post('/api/register', userData);
export const loginUser = async (userData) => apiClient.post('/api/login', userData);
export const getUserDetails = (userId) => apiClient.get(`/api/users/${userId}`);
export const updateUserDetails = (userId, userData) => apiClient.put(`/api/users/${userId}`, userData);

export default apiClient; // Export the axios instance for reuse