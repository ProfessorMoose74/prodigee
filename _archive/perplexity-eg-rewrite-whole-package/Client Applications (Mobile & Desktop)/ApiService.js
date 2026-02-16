// ApiService.js
import axios from 'axios';
// Assume a utility for storing/retrieving the token securely
import { getAuthToken, removeAuthToken } from './tokenStorage'; 

const apiClient = axios.create({
  baseURL: 'https://your_domain_or_ip/api/v1', // Always points to the Nginx proxy
});

// Add a request interceptor to include the JWT
apiClient.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add a response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid or expired, log the user out
      removeAuthToken();
      // Redirect to login screen
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  register: (email, password) => apiClient.post('/auth/register', { email, password }),
  
  // AI Endpoints
  getCharacterResponse: (prompt, character) => apiClient.post('/character', { prompt, character }),
  
  // Library
  searchLibrary: (query) => apiClient.get(`/library/search?q=${query}`),
};