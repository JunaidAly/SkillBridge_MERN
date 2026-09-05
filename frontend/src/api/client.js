import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth token from localStorage on every request
apiClient.interceptors.request.use((config) => {
  const stored = localStorage.getItem('auth');
  if (stored) {
    try {
      const { token } = JSON.parse(stored);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      // ignore malformed auth storage
    }
  }
  return config;
});

// If the account was suspended after this session's JWT was issued, every
// subsequent request hits this until the token itself expires - catch it
// here once, in one place, instead of every call site having to check.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.code === 'ACCOUNT_SUSPENDED') {
      localStorage.removeItem('auth');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

