import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    if (adminInfo.token) {
      config.headers.Authorization = `Bearer ${adminInfo.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const productAPI = {
  getProducts: (params) => api.get('/products', { params }),
  getProductById: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  // Verification requests
  getVerificationRequests: (params) => api.get('/users/verification-requests', { params }),
  updateVerificationStatus: (id, data) => api.put(`/users/verification-requests/${id}`, data),
};

export default api;