// controllers/depositController.js - Xử lý yêu cầu nạp tiền
const Deposit = require('../models/Deposit');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { DEPOSIT_STATUS } = require('../config/constants');
const { sendAdminNewDepositEmail } = require('../utils/sendEmail');
const SystemSetting = require('../models/SystemSetting');
const PayOS = require('@payos/node');

// Khởi tạo PayOS nếu có cấu hình
let payos = null;
if (process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY) {
  try {
    payos = new PayOS(
      process.env.PAYOS_CLIENT_ID,
      process.env.PAYOS_API_KEY,
      process.env.PAYOS_CHECKSUM_KEY
    );
    console.log('💳 PayOS initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize PayOS:', error.message);
  }
}

/**
 * POST /api/deposits
 * Tạo đơn nạp tiền VietQR / PayOS
 */
const createDeposit = async (req, res, next) => {
  try {
    // Kiểm tra xem admin có đang cho phép nạp tiền không
    const depositSetting = await SystemSetting.findOne({ key: 'deposit_enabled' });
    if (depositSetting && depositSetting.value === false) {
      return errorResponse(res, 'Chức năng nạp tiền đang được bảo trì. Vui lòng thử lại sau.', 403);
    }

    const { amount, method } = req.body;
    const userId = req.user._id;

    if (!amount || isNaN(amount) || amount < 10000) {
      return errorResponse(res, 'Số tiền nạp tối thiểu là 10.000 VNĐ', 400);
    }

    // Sinh mã đơn hàng số ngẫu nhiên (PayOS chỉ chấp nhận Number)
    const orderCode = Math.floor(100000 + Math.random() * 900000) + (Date.now() % 1000);
    const transferContent = `WSAC ${orderCode}`;

    // Cấu hình ngân hàng nhận tiền mặc định (nếu chưa cấu hình trong .env)
    const bankId = process.env.BANK_ID || 'MB'; // MBBank mặc định
    const bankAccount = process.env.BANK_ACCOUNT || '0978264349';
    const bankOwner = process.env.BANK_OWNER || 'NGUYEN TAN DUONG';

    let checkoutUrl = '';
    let qrCode = '';
    let paymentLinkId = '';

    // Luồng 1: Nếu cấu hình PayOS thì gọi API tạo link của PayOS
    if (payos) {
      try {
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const paymentBody = {
          orderCode,
          amount,
          description: `Nap tien ${transferContent}`,
          cancelUrl: `${clientUrl}/deposit?orderCode=${orderCode}&status=cancelled`,
          returnUrl: `${clientUrl}/deposit?orderCode=${orderCode}&status=success`,
        };

        const paymentLinkRes = await payos.createPaymentLink(paymentBody);
        checkoutUrl = paymentLinkRes.checkoutUrl;
        qrCode = paymentLinkRes.qrTemplate || ''; // Một số phiên bản PayOS trả về template
        paymentLinkId = paymentLinkRes.paymentLinkId;
      } catch (payosError) {
        console.error('⚠️ PayOS Error, falling back to VietQR free API:', payosError.message);
      }
    }

    // Luồng 2: Fallback tạo mã VietQR động trực tiếp qua img.vietqr.io (Hoạt động 100% tức thì)
    if (!checkoutUrl) {
      // API VietQR động tự điền STK, Số tiền và Nội dung
      qrCode = `https://img.vietqr.io/image/${bankId}-${bankAccount}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankOwner)}`;
      // Gửi link hướng dẫn thanh toán local
      checkoutUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/deposit?orderCode=${orderCode}`;
    }

    // Lưu vào database
    const deposit = new Deposit({
      userId,
      amount,
      orderCode,
      transferContent,
      status: DEPOSIT_STATUS.PENDING,
      checkoutUrl,
      qrCode,
      paymentLinkId,
      note: `Khách hàng tạo đơn nạp ${amount.toLocaleString('vi-VN')}đ`,
    });

    await deposit.save();

    // Lấy thông tin user hiện tại để gửi email
    const user = req.user;
    // Gửi email thông báo cho admin (chạy nền)
    sendAdminNewDepositEmail(deposit, user, amount).catch(err => {
      console.error('Lỗi khi gửi email admin thông báo lệnh nạp mới:', err);
    });

    return successResponse(
      res,
      {
        depositId: deposit._id,
        orderCode,
        amount,
        transferContent,
        checkoutUrl,
        qrCode,
        bankInfo: {
          bankId,
          bankAccount,
          bankOwner,
        },
      },
      'Tạo đơn nạp tiền thành công',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/deposits/my
 * Lấy lịch sử nạp tiền của chính user đó
 */
const getMyDeposits = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(parseInt(limit), 50);
    const skip = (pageNum - 1) * limitNum;

    const [deposits, total] = await Promise.all([
      Deposit.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Deposit.countDocuments({ userId: req.user._id }),
    ]);

    return res.json({
      success: true,
      data: deposits,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/deposits/balance
 * Lấy số dư ví hiện tại của user
 */
const getMyBalance = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('balance');
    return successResponse(res, { balance: user.balance || 0 }, 'Lấy số dư tài khoản thành công');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/deposits/:id
 * Lấy thông tin chi tiết một đơn nạp
 */
const getDepositById = async (req, res, next) => {
  try {
    const deposit = await Deposit.findOne({ _id: req.params.id, userId: req.user._id }).lean();
    if (!deposit) {
      return errorResponse(res, 'Không tìm thấy đơn nạp tiền', 404);
    }
    return successResponse(res, deposit, 'Lấy chi tiết đơn nạp thành công');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDeposit,
  getMyDeposits,
  getMyBalance,
  getDepositById,
};
