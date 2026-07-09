import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      let friendlyMessage = 'An unexpected error occurred. Please try again.';

      if (status === 401) {
        friendlyMessage = 'Session Expired - Please login again.';
        if (!error.config.url.includes('/token/')) {
          localStorage.removeItem('token');
          localStorage.removeItem('is_staff');
          localStorage.removeItem('username');
          window.location.href = '/login';
        }
      } else if (status === 400) {
        // Try to extract field-specific errors, fallback to standard message
        friendlyMessage = 'Bad Request - Please check the form fields and try again.';
        if (error.response.data && typeof error.response.data === 'object') {
          const firstError = Object.values(error.response.data).flat()[0];
          if (typeof firstError === 'string') {
             friendlyMessage = `Bad Request: ${firstError}`;
          }
        }
      } else if (status === 404) {
        friendlyMessage = 'Resource Not Found - The requested item does not exist.';
      } else if (status === 409) {
        friendlyMessage = 'Conflict - This item already exists or causes a conflict.';
      } else if (status === 500) {
        friendlyMessage = 'Internal Server Error - Please try again later.';
      }

      // Attach friendly message for UI consumption
      error.friendlyMessage = friendlyMessage;
    } else {
      error.friendlyMessage = 'Network Error - Please check your connection.';
    }
    return Promise.reject(error);
  }
);

export default client;
