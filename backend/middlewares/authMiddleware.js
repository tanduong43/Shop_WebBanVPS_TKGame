// middlewares/authMiddleware.js - Xác thực JWT token
const { verifyToken } = require('../utils/generateToken');
const User = require('../models/User');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Middleware xác thực người dùng bằng JWT
 * Token được đặt trong header: Authorization: Bearer <token>
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Lấy token từ header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Không có token xác thực. Vui lòng đăng nhập.', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = verifyToken(token);

    // Tìm user trong DB và kiểm tra isActive
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return errorResponse(res, 'Người dùng không tồn tại', 401);
    }
    if (!user.isActive) {
      return errorResponse(res, 'Tài khoản đã bị vô hiệu hóa', 403);
    }

    // Gắn user vào request để dùng trong các middleware/controller tiếp theo
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Token không hợp lệ', 401);
    }
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token đã hết hạn. Vui lòng đăng nhập lại.', 401);
    }
    next(error);
  }
};

module.exports = authMiddleware;
