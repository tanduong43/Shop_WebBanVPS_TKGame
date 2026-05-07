// routes/adminRoutes.js - Admin dashboard routes
const express = require('express');
const router = express.Router();
const { getDashboard, getUsers, deleteUser, restoreUser } = require('../controllers/adminController');
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

module.exports = router;
