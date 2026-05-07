// controllers/authController.js - Xử lý xác thực người dùng
const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * POST /api/auth/register
 * Đăng ký tài khoản mới
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Username';
      return errorResponse(res, `${field} đã được sử dụng`, 409);
    }

    // Tạo user mới (password sẽ được hash trong pre-save hook)
    const user = await User.create({ username, email, password });

    // Tạo token
    const token = generateToken({ id: user._id, role: user.role });

    return successResponse(
      res,
      { user: user.toJSON(), token },
      'Đăng ký thành công',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Đăng nhập
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body; // "email" có thể là email hoặc username

    // Lấy user kèm password (select: false nên phải chỉ định rõ)
    const identifier = String(email || '').trim();
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier },
      ],
    }).select('+password');
    if (!user) {
      return errorResponse(res, 'Email/Username hoặc mật khẩu không đúng', 401);
    }

    // Kiểm tra tài khoản bị vô hiệu hóa
    if (!user.isActive) {
      return errorResponse(res, 'Tài khoản đã bị vô hiệu hóa', 403);
    }

    // So sánh password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 'Email/Username hoặc mật khẩu không đúng', 401);
    }

    const token = generateToken({ id: user._id, role: user.role });

    return successResponse(res, { user: user.toJSON(), token }, 'Đăng nhập thành công');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Lấy thông tin người dùng hiện tại (cần authMiddleware)
 */
const getProfile = async (req, res, next) => {
  try {
    // req.user đã được gắn bởi authMiddleware
    return successResponse(res, req.user, 'Lấy thông tin thành công');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/auth/change-password
 * Đổi mật khẩu
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 'Mật khẩu hiện tại không đúng', 400);
    }

    user.password = newPassword;
    await user.save();

    return successResponse(res, null, 'Đổi mật khẩu thành công');
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getProfile, changePassword };
