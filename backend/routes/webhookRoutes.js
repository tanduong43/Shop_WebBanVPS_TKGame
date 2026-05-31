// routes/webhookRoutes.js - Route tiếp nhận thông báo chuyển khoản tự động từ Ngân hàng
const express = require('express');
const router = express.Router();
const { handlePayOSWebhook, handleSePayWebhook } = require('../controllers/webhookController');

// Webhook từ ngân hàng không cần token xác thực JWT (vì do hệ thống ngân hàng/cổng thanh toán gọi tự động)
// Việc bảo mật được thực hiện qua xác minh chữ ký (signature) trong controller

// POST /api/webhook/payos - Nhận webhook từ cổng thanh toán PayOS
router.post('/payos', handlePayOSWebhook);

// POST /api/webhook/sepay - Nhận webhook từ SePay
router.post('/sepay', handleSePayWebhook);

module.exports = router;
