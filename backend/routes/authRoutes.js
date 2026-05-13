// routes/authRoutes.js - Các route xác thực
const express = require('express');
const router = express.Router();
const { register, login, getProfile, changePassword, forgotPassword } = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const { registerValidation, loginValidation } = require('../middlewares/validate');

// POST /api/auth/register - Đăng ký
router.post('/register', registerValidation, register);

// POST /api/auth/login - Đăng nhập
router.post('/login', loginValidation, login);

// GET /api/auth/me - Lấy thông tin profile (cần đăng nhập)
router.get('/me', authMiddleware, getProfile);

// PUT /api/auth/change-password - Đổi mật khẩu
router.put('/change-password', authMiddleware, changePassword);

// POST /api/auth/forgot-password - Quên mật khẩu
router.post('/forgot-password', forgotPassword);

module.exports = router;
