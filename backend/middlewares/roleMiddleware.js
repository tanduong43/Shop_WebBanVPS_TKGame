// middlewares/roleMiddleware.js - Phân quyền theo role
const { USER_ROLES } = require('../config/constants');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Factory function tạo middleware kiểm tra role
 * @param {...string} roles - Các role được phép truy cập
 * @returns {Function} Express middleware
 * 
 * Dùng sau authMiddleware:
 * router.delete('/users/:id', authMiddleware, requireRole(USER_ROLES.ADMIN), deleteUser)
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    // authMiddleware phải chạy trước
    if (!req.user) {
      return errorResponse(res, 'Chưa xác thực người dùng', 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        'Bạn không có quyền thực hiện hành động này',
        403
      );
    }

    next();
  };
};

// Shortcut cho admin
const requireAdmin = requireRole(USER_ROLES.ADMIN);

module.exports = { requireRole, requireAdmin };
