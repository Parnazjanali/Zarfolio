import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Optional: Add a request interceptor to include the auth token automatically
// This depends on how you store and retrieve the token (e.g., from localStorage, context)
// For example, if using localStorage and AuthContext like in the project:
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // Or useAuth().authToken if accessible here
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Add a response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle global errors, e.g., 401 unauthorized by redirecting to login
    if (error.response && error.response.status === 401) {
      // Assuming your AuthContext or a similar mechanism handles logout globally
      // For example:
      // import { logout } from '../context/AuthContext'; // This won't work directly due to hook rules
      // You might need to dispatch a custom event or call a globally accessible logout function
      console.error('Unauthorized, logging out.');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      // window.location.href = '/login'; // Force redirect
    }
    return Promise.reject(error);
  }
);

export default apiClient;
