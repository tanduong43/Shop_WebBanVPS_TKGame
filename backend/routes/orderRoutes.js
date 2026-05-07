// routes/orderRoutes.js - Các route đơn hàng
const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  getOrderById,
} = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/roleMiddleware');
const { orderValidation, updateOrderStatusValidation, mongoIdParam } = require('../middlewares/validate');

// ─── User routes (cần đăng nhập) ────────────────────────────────────────────

// POST /api/orders - Tạo đơn hàng
router.post('/', authMiddleware, orderValidation, createOrder);

// GET /api/orders/my - Lịch sử đơn của mình
router.get('/my', authMiddleware, getMyOrders);

// ─── Admin routes ─────────────────────────────────────────────────────────

// GET /api/orders - Tất cả đơn hàng (admin)
router.get('/', authMiddleware, requireAdmin, getAllOrders);

// GET /api/orders/:id - Chi tiết 1 đơn hàng
router.get('/:id', authMiddleware, mongoIdParam('id'), getOrderById);

// PUT /api/orders/:id/status - Cập nhật trạng thái (admin)
router.put('/:id/status', authMiddleware, requireAdmin, mongoIdParam('id'), updateOrderStatusValidation, updateOrderStatus);

module.exports = router;
