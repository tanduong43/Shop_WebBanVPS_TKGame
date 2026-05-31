// routes/wheelRoutes.js - Route xử lý tính năng Vòng quay cho User
const express = require('express');
const router = express.Router();
const {
  getAllWheels,
  getWheelDetails,
  spinWheel,
  getMySpinHistory,
} = require('../controllers/wheelController');
const authMiddleware = require('../middlewares/authMiddleware');

// Route công khai (khách xem danh sách vòng quay & cơ cấu giải trước khi chơi)
router.get('/', getAllWheels);
router.get('/:id', getWheelDetails);

// Route yêu cầu đăng nhập (để quay thưởng trừ tiền & xem lịch sử)
router.use(authMiddleware);
router.post('/:id/spin', spinWheel);
router.get('/my/history', getMySpinHistory);

module.exports = router;
