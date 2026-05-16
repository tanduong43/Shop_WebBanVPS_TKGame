// src/services/api.js - Axios instance với interceptors
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Tạo axios instance với config mặc định
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: tự động gắn JWT token vào header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: xử lý lỗi toàn cục
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token hết hạn hoặc không hợp lệ → logout
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Chỉ hiện toast nếu không phải trang login
      if (!window.location.pathname.includes('/login')) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authAPI = {
  getCaptcha:     ()     => api.get('/auth/captcha'),
  register:       (data) => api.post('/auth/register', data),
  login:          (data) => api.post('/auth/login', data),
  getProfile:     ()     => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
};

// ─── Product API ─────────────────────────────────────────────────────────────
export const productAPI = {
  getAll:       (params)     => api.get('/products', { params }),
  getById:      (id)         => api.get(`/products/${id}`),
  getAllAdmin:   (params)     => api.get('/products/admin/all', { params }),
  create:       (data)       => api.post('/products', data),
  update:       (id, data)   => api.put(`/products/${id}`, data),
  delete:       (id)         => api.delete(`/products/${id}`),
  toggleActive: (id, active) => api.put(`/products/${id}`, { isActive: active }),
};

// ─── Order API ───────────────────────────────────────────────────────────────
export const orderAPI = {
  create:       (data)         => api.post('/orders', data),
  getMyOrders:  (params)       => api.get('/orders/my', { params }),
  getAllOrders:  (params)       => api.get('/orders', { params }),
  getById:      (id)           => api.get(`/orders/${id}`),
  updateStatus: (id, data)     => api.put(`/orders/${id}/status`, data),
};

// ─── Admin API ───────────────────────────────────────────────────────────────
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers:     (params) => api.get('/admin/users', { params }),
  deleteUser:   (id)     => api.delete(`/admin/users/${id}`),
  restoreUser:  (id)     => api.put(`/admin/users/${id}/restore`),
};

export default api;
