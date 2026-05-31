// routes/adminWheelRoutes.js - Route xử lý tính năng Vòng quay dành cho Admin
const express = require('express');
const router = express.Router();
const {
  getAllWheelsAdmin,
  getWheelDetailsAdmin,
  createWheel,
  updateWheel,
  deleteWheel,
  createPrize,
  updatePrize,
  deletePrize,
  getAllSpinHistory,
} = require('../controllers/adminWheelController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/roleMiddleware');
const { mongoIdParam } = require('../middlewares/validate');

// Tất cả các route quản trị đều yêu cầu đăng nhập Admin
router.use(authMiddleware, requireAdmin);

// CRUD Vòng Quay (Spin Wheels)
router.get('/wheels', getAllWheelsAdmin);
router.get('/wheels/:id', mongoIdParam('id'), getWheelDetailsAdmin);
router.post('/wheels', createWheel);
router.put('/wheels/:id', mongoIdParam('id'), updateWheel);
router.delete('/wheels/:id', mongoIdParam('id'), deleteWheel);

// CRUD Phần quà (Prizes)
router.post('/prizes', createPrize);
router.put('/prizes/:id', mongoIdParam('id'), updatePrize);
router.delete('/prizes/:id', mongoIdParam('id'), deletePrize);

// Xem lịch sử quay toàn diện của hệ thống
router.get('/history', getAllSpinHistory);

module.exports = router;
