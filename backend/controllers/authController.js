// controllers/authController.js - Xử lý xác thực người dùng
const User            = require('../models/User');
const CaptchaToken    = require('../models/CaptchaToken');
const RegistrationLog = require('../models/RegistrationLog');
const { generateToken }                    = require('../utils/generateToken');
const { successResponse, errorResponse }   = require('../utils/apiResponse');
const nodemailer = require('nodemailer');

// ─── Hằng số giới hạn đăng ký ────────────────────────────────────────────────
const MAX_ACCOUNTS_PER_DAY = 3;
const MIN_GAP_MS           = 60 * 60 * 1000; // 1 tiếng

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Lấy IP thực (hỗ trợ proxy / nginx / Render / Railway) */
const getClientIp = (req) => {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
};

/** Trả về chuỗi ngày 'YYYY-MM-DD' theo giờ Việt Nam */
const getTodayVN = () => {
  const now = new Date();
  // UTC+7
  const vn = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return vn.toISOString().slice(0, 10);
};

// ─── Email ────────────────────────────────────────────────────────────────────
const normalizeEnv = (value) => {
  let s = String(value ?? '').trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
};

const createMailTransporter = () => {
  const emailUser = normalizeEnv(process.env.EMAIL_USER).toLowerCase();
  let emailPass   = normalizeEnv(process.env.EMAIL_PASS);
  emailPass = emailPass.replace(/\s+/g, '');

  if (!emailUser || !emailPass) {
    throw Object.assign(new Error('EMAIL_USER hoặc EMAIL_PASS chưa cấu hình'), { code: 'EMISSING' });
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: emailUser, pass: emailPass },
  });
};

// ─── CAPTCHA ──────────────────────────────────────────────────────────────────

/**
 * GET /api/auth/captcha
 * Tạo câu hỏi toán ngẫu nhiên, lưu đáp án vào MongoDB, trả về { captchaId, question }
 */
const getCaptcha = async (req, res, next) => {
  try {
    const ops = ['+', '-', '×'];
    const op  = ops[Math.floor(Math.random() * ops.length)];

    let a, b, answer;
    if (op === '+') {
      a = Math.floor(Math.random() * 20) + 1; // 1–20
      b = Math.floor(Math.random() * 20) + 1;
      answer = a + b;
    } else if (op === '-') {
      a = Math.floor(Math.random() * 20) + 10; // 10–29
      b = Math.floor(Math.random() * a) + 1;   // b < a → kết quả dương
      answer = a - b;
    } else {
      a = Math.floor(Math.random() * 9) + 2;  // 2–10
      b = Math.floor(Math.random() * 9) + 2;
      answer = a * b;
    }

    const captcha = await CaptchaToken.create({ answer });

    return successResponse(res, {
      captchaId: captcha._id,
      question: `${a} ${op} ${b} = ?`,
    }, 'Tạo CAPTCHA thành công');
  } catch (error) {
    next(error);
  }
};

// ─── Register ─────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Đăng ký tài khoản mới
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password, captchaId, captchaAnswer } = req.body;

    // ── 1. Kiểm tra CAPTCHA ──────────────────────────────────────────────────
    if (!captchaId || captchaAnswer === undefined || captchaAnswer === '') {
      return errorResponse(res, 'Vui lòng hoàn thành xác minh CAPTCHA', 400);
    }

    const captcha = await CaptchaToken.findById(captchaId);
    if (!captcha) {
      return errorResponse(res, 'CAPTCHA đã hết hạn. Vui lòng làm mới và thử lại.', 400);
    }
    if (captcha.used) {
      return errorResponse(res, 'CAPTCHA này đã được sử dụng. Vui lòng làm mới CAPTCHA.', 400);
    }
    if (Number(captchaAnswer) !== captcha.answer) {
      // Không xóa captcha → cho phép thử lại
      return errorResponse(res, 'Đáp án CAPTCHA không đúng. Vui lòng thử lại.', 400);
    }

    // Đánh dấu đã dùng
    captcha.used = true;
    await captcha.save();

    // ── 2. Kiểm tra giới hạn đăng ký theo IP (MongoDB) ──────────────────────
    const ip    = getClientIp(req);
    const today = getTodayVN();
    const now   = Date.now();

    let log = await RegistrationLog.findOne({ ip, date: today });

    if (log) {
      // Kiểm tra số lượng
      if (log.timestamps.length >= MAX_ACCOUNTS_PER_DAY) {
        return errorResponse(
          res,
          `Mỗi địa chỉ IP chỉ được tạo tối đa ${MAX_ACCOUNTS_PER_DAY} tài khoản trong 1 ngày. Vui lòng thử lại vào ngày mai.`,
          429
        );
      }

      // Kiểm tra khoảng cách
      const lastTime = log.timestamps[log.timestamps.length - 1];
      const elapsed  = now - lastTime;
      if (elapsed < MIN_GAP_MS) {
        const waitMin = Math.ceil((MIN_GAP_MS - elapsed) / 60000);
        return errorResponse(
          res,
          `Bạn vừa tạo tài khoản. Vui lòng chờ thêm ${waitMin} phút nữa mới có thể tạo tài khoản tiếp theo.`,
          429
        );
      }
    }

    // ── 3. Kiểm tra email / username đã tồn tại chưa ────────────────────────
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Username';
      return errorResponse(res, `${field} đã được sử dụng`, 409);
    }

    // ── 4. Tạo user mới ──────────────────────────────────────────────────────
    const user  = await User.create({ username, email, password });
    const token = generateToken({ id: user._id, role: user.role });

    // ── 5. Ghi log IP vào MongoDB ────────────────────────────────────────────
    if (log) {
      log.timestamps.push(now);
      await log.save();
    } else {
      await RegistrationLog.create({ ip, date: today, timestamps: [now] });
    }

    return successResponse(res, { user: user.toJSON(), token }, 'Đăng ký thành công', 201);
  } catch (error) {
    next(error);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

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
    if (!user.isActive) {
      return errorResponse(res, 'Tài khoản đã bị vô hiệu hóa', 403);
    }

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

// ─── Profile ──────────────────────────────────────────────────────────────────

/**
 * GET /api/auth/me
 */
const getProfile = async (req, res, next) => {
  try {
    return successResponse(res, req.user, 'Lấy thông tin thành công');
  } catch (error) {
    next(error);
  }
};

// ─── Change Password ──────────────────────────────────────────────────────────

/**
 * PUT /api/auth/change-password
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

// ─── Forgot Password ──────────────────────────────────────────────────────────

/**
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return errorResponse(res, 'Vui lòng cung cấp email', 400);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return errorResponse(res, 'Không tìm thấy người dùng với email này', 404);
    }

    const newPassword = Math.floor(100000 + Math.random() * 900000).toString();
    user.password = newPassword;
    await user.save();

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
      console.error('[mail] SMTP error:', error.code, error.responseCode, error.response);
    }
    if (error?.code === 'EMISSING') {
      return errorResponse(res, 'Chưa cấu hình EMAIL_USER hoặc EMAIL_PASS trên server.', 500);
    }
    if (error?.code === 'EAUTH' || String(error?.message || '').includes('BadCredentials')) {
      return errorResponse(res, 'Gmail từ chối đăng nhập SMTP.', 502);
    }
    next(error);
  }
};

module.exports = { getCaptcha, register, login, getProfile, changePassword, forgotPassword };
