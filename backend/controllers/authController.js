// controllers/authController.js - Xử lý xác thực người dùng
const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const nodemailer = require('nodemailer');

const normalizeEnv = (value) => {
  let s = String(value ?? '').trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
};

const createMailTransporter = () => {
  const emailUser = normalizeEnv(process.env.EMAIL_USER).toLowerCase();
  // App password hay có dấu cách nhóm 4 ký tự; đôi khi .env có ngoặc kép hoặc ký tự ẩn.
  let emailPass = normalizeEnv(process.env.EMAIL_PASS);
  emailPass = emailPass.replace(/\s+/g, '');

  if (!emailUser || !emailPass) {
    throw Object.assign(new Error('EMAIL_USER hoặc EMAIL_PASS chưa cấu hình'), { code: 'EMISSING' });
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};

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

/**
 * POST /api/auth/forgot-password
 * Quên mật khẩu
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return errorResponse(res, 'Vui lòng cung cấp email', 400);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return errorResponse(res, 'Không tìm thấy người dùng với email này', 404);
    }

    // Generate random 6-digit password
    const newPassword = Math.floor(100000 + Math.random() * 900000).toString();

    // Update user password
    user.password = newPassword;
    await user.save();

    // Send email
    const transporter = createMailTransporter();

    const mailOptions = {
      from: normalizeEnv(process.env.EMAIL_USER).toLowerCase(),
      to: email,
      subject: 'Mật khẩu mới của bạn - DuongKa WebShop',
      text: `Mật khẩu mới của bạn là: ${newPassword}\nVui lòng đăng nhập và đổi lại mật khẩu ngay lập tức để bảo mật.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1a2e; color: #fff; border-radius: 10px;">
          <h2 style="color: #00d4ff; text-align: center;">Khôi phục mật khẩu</h2>
          <p style="font-size: 16px;">Xin chào <strong>${user.username}</strong>,</p>
          <p style="font-size: 16px;">Chúng tôi đã nhận được yêu cầu khôi phục mật khẩu của bạn. Mật khẩu mới của bạn là:</p>
          <div style="background-color: #0d0d1a; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #6c63ff;">${newPassword}</span>
          </div>
          <p style="font-size: 16px;">Vui lòng <a href="${process.env.CLIENT_URL}/login" style="color: #00d4ff;">đăng nhập</a> và đổi lại mật khẩu ngay lập tức để đảm bảo an toàn.</p>
          <p style="font-size: 14px; color: #aaa; margin-top: 30px;">Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này hoặc liên hệ hỗ trợ.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return successResponse(res, null, 'Mật khẩu mới đã được gửi đến email của bạn');
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      // Không log mật khẩu; chỉ giúp chẩn đoán từ phía SMTP.
      console.error('[mail] SMTP error:', error.code, error.responseCode, error.response);
    }

    if (error?.code === 'EMISSING') {
      return errorResponse(res, 'Chưa cấu hình EMAIL_USER hoặc EMAIL_PASS trên server.', 500);
    }
    if (error?.code === 'EAUTH' || String(error?.message || '').includes('BadCredentials')) {
      return errorResponse(
        res,
        'Gmail từ chối đăng nhập SMTP: App Password phải được tạo đúng tài khoản EMAIL_USER, bật 2 bước xác minh, và xóa tạo lại mật khẩu ứng dụng nếu cần. Tài khoản Google Workspace có thể bị admin tắt App Password.',
        502
      );
    }
    next(error);
  }
};

module.exports = { register, login, getProfile, changePassword, forgotPassword };
