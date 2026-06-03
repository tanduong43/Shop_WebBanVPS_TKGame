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
    // Lỗi kết nối mạng (Network Error / Timeout / Disconnected)
    if (!error.response) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('Kết nối mạng quá yếu (yêu cầu quá hạn). Vui lòng kiểm tra lại đường truyền.');
      } else {
        toast.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      }
    }

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
  hideAll:      ()           => api.put('/products/admin/hide-all'),
  showBulk:     (type)       => api.put('/products/admin/show-bulk', { type }),
};

// ─── Order API ───────────────────────────────────────────────────────────────
export const orderAPI = {
  create:       (data)         => api.post('/orders', data),
  getMyOrders:  (params)       => api.get('/orders/my', { params }),
  getAllOrders:  (params)       => api.get('/orders', { params }),
  getById:      (id)           => api.get(`/orders/${id}`),
  updateStatus: (id, data)     => api.put(`/orders/${id}/status`, data),
};

// ─── Deposit API ─────────────────────────────────────────────────────────────
export const depositAPI = {
  create:    (amount) => api.post('/deposits', { amount }),
  getMyList: (params) => api.get('/deposits/my', { params }),
  getBalance:()       => api.get('/deposits/balance'),
  getDetail: (id)     => api.get(`/deposits/${id}`),
};

// ─── Spin Wheel API ──────────────────────────────────────────────────────────
export const wheelAPI = {
  getAll:     ()       => api.get('/spin-wheels'),
  getDetail:  (id)     => api.get(`/spin-wheels/${id}`),
  spin:       (id)     => api.post(`/spin-wheels/${id}/spin`),
  getMyHistory:(params) => api.get('/spin-wheels/my/history', { params }),
};

// ─── Admin Spin Wheel API ────────────────────────────────────────────────────
export const adminWheelAPI = {
  getAllWheels: () => api.get('/admin-wheels/wheels'),
  getWheelDetails: (id) => api.get(`/admin-wheels/wheels/${id}`),
  createWheel: (data)     => api.post('/admin-wheels/wheels', data),
  updateWheel: (id, data) => api.put(`/admin-wheels/wheels/${id}`, data),
  deleteWheel: (id)       => api.delete(`/admin-wheels/wheels/${id}`),
  createPrize: (data)     => api.post('/admin-wheels/prizes', data),
  updatePrize: (id, data) => api.put(`/admin-wheels/prizes/${id}`, data),
  deletePrize: (id)       => api.delete(`/admin-wheels/prizes/${id}`),
  getHistory:  (params)   => api.get('/admin-wheels/history', { params }),
};

// ─── Bầu Cua API ────────────────────────────────────────────────────────────────────
export const bauCuaAPI = {
  getRooms:       ()               => api.get('/baucua/rooms'),
  getRoomState:   (roomId)         => api.get(`/baucua/rooms/${roomId}/state`),
  placeBet:       (roomId, data)   => api.post(`/baucua/rooms/${roomId}/bet`, data),
  getRoomHistory: (roomId, params) => api.get(`/baucua/rooms/${roomId}/history`, { params }),
};

// ─── Admin Bầu Cua API ──────────────────────────────────────────────────────────────
export const adminBauCuaAPI = {
  getStats:        ()               => api.get('/admin/baucua/stats'),
  getAllRooms:      ()               => api.get('/admin/baucua/rooms'),
  createRoom:      (data)           => api.post('/admin/baucua/rooms', data),
  updateRoom:      (id, data)       => api.put(`/admin/baucua/rooms/${id}`, data),
  toggleRoom:      (id)             => api.put(`/admin/baucua/rooms/${id}/toggle`),
  deleteRoom:      (id)             => api.delete(`/admin/baucua/rooms/${id}`),
  getRoomHistory:  (id, params)     => api.get(`/admin/baucua/rooms/${id}/history`, { params }),
};

// ─── Trivia (Đố Vui Sinh Tồn) API ────────────────────────────────────────────────
export const triviaAPI = {
  getTopics:       ()               => api.get('/questions/topics'),
  getTopicsAdmin:  ()               => api.get('/questions/topics/admin'),
  createTopic:     (data)           => api.post('/questions/topics', data),
  deleteTopic:     (id)             => api.delete(`/questions/topics/${id}`),
  getQuestions:    (params)         => api.get('/questions', { params }),
  createQuestion:  (data)           => api.post('/questions', data),
  deleteQuestion:  (id)             => api.delete(`/questions/${id}`),
  importQuestions: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/questions/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ─── Admin API ────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers:     (params) => api.get('/admin/users', { params }),
  deleteUser:   (id)     => api.delete(`/admin/users/${id}`),
  restoreUser:  (id)     => api.put(`/admin/users/${id}/restore`),
  
  // --- Admin Deposit APIs ---
  getAllDeposits:  (params) => api.get('/admin/deposits', { params }),
  confirmDeposit:  (id)     => api.put(`/admin/deposits/${id}/confirm`), // Duyệt nạp / Chạy giả lập
  rejectDeposit:   (id, reason) => api.put(`/admin/deposits/${id}/reject`, { reason }),
  adjustUserBalance:(userId, amount, description) => api.put(`/admin/users/${userId}/balance`, { amount, description }),
  getDepositStats: () => api.get('/admin/deposit-stats'),
  getSettings:     () => api.get('/admin/settings'),
  updateSetting:   (key, value) => api.put('/admin/settings', { key, value }),
};

export default api;
