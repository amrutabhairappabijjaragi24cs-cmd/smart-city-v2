import api from '../utils/api';

const api = api.create({
  baseURL: 'https://smartcity-backend-xsxs.onrender.com',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sc_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sc_token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;