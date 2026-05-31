// routes/depositRoutes.js - Route xử lý nạp tiền cho User
const express = require('express');
const router = express.Router();
const {
  createDeposit,
  getMyDeposits,
  getMyBalance,
  getDepositById,
} = require('../controllers/depositController');
const authMiddleware = require('../middlewares/authMiddleware');

// Tất cả các route nạp tiền đều cần đăng nhập
router.use(authMiddleware);

// POST /api/deposits - Tạo đơn nạp tiền (VietQR/PayOS)
router.post('/', createDeposit);

// GET /api/deposits/my - Lịch sử nạp tiền của tôi
router.get('/my', getMyDeposits);

// GET /api/deposits/balance - Lấy số dư ví hiện tại
router.get('/balance', getMyBalance);

// GET /api/deposits/:id - Chi tiết 1 đơn nạp
router.get('/:id', getDepositById);

module.exports = router;
