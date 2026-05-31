// routes/adminRoutes.js - Admin dashboard routes
const express = require('express');
const router = express.Router();
const { getDashboard, getUsers, deleteUser, restoreUser, getSettings, updateSetting } = require('../controllers/adminController');
const { 
  getAllDeposits, 
  confirmDeposit, 
  rejectDeposit, 
  adjustUserBalance, 
  getDepositStats 
} = require('../controllers/adminDepositController'); // Thêm controllers nạp tiền
const authMiddleware = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/roleMiddleware');
const { mongoIdParam } = require('../middlewares/validate');

// Tất cả admin routes đều cần auth + admin role
router.use(authMiddleware, requireAdmin);

// GET /api/admin/dashboard - Thống kê tổng quan
router.get('/dashboard', getDashboard);

// GET /api/admin/users - Danh sách users
router.get('/users', getUsers);

// DELETE /api/admin/users/:id - Vô hiệu hóa user
router.delete('/users/:id', mongoIdParam('id'), deleteUser);

// PUT /api/admin/users/:id/restore - Khôi phục user
router.put('/users/:id/restore', mongoIdParam('id'), restoreUser);

// GET /api/admin/deposits - Danh sách toàn bộ đơn nạp tiền
router.get('/deposits', getAllDeposits);

// PUT /api/admin/deposits/:id/confirm - Duyệt nạp tiền (hoặc chạy giả lập)
router.put('/deposits/:id/confirm', mongoIdParam('id'), confirmDeposit);

// PUT /api/admin/deposits/:id/reject - Từ chối duyệt nạp tiền
router.put('/deposits/:id/reject', mongoIdParam('id'), rejectDeposit);

// PUT /api/admin/users/:id/balance - Điều chỉnh số dư user trực tiếp
router.put('/users/:id/balance', mongoIdParam('id'), adjustUserBalance);

// GET /api/admin/deposit-stats - Xem thống kê nạp tiền
router.get('/deposit-stats', getDepositStats);

// GET /api/admin/settings - Lấy cấu hình hệ thống
router.get('/settings', getSettings);

// PUT /api/admin/settings - Cập nhật cấu hình
router.put('/settings', updateSetting);

module.exports = router;
