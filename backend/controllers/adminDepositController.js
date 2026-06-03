// controllers/adminDepositController.js - API quản lý nạp tiền dành cho Admin
const Deposit = require('../models/Deposit');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { DEPOSIT_STATUS, TRANSACTION_TYPES } = require('../config/constants');
const { processSuccessfulDeposit } = require('./webhookController');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { emitToUser } = require('../config/socket');
const { logAdminAction } = require('../utils/auditLogger');

/**
 * GET /api/admin/deposits
 * Danh sách toàn bộ đơn nạp tiền (có phân trang, tìm kiếm, lọc trạng thái)
 */
const getAllDeposits = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    
    // Lọc theo trạng thái
    if (status) {
      query.status = status;
    }

    // Tìm kiếm theo tên khách hàng hoặc mã nội dung chuyển khoản
    if (search) {
      // Tìm user khớp trước
      const matchedUsers = await User.find({
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ]
      }).select('_id');
      
      const userIds = matchedUsers.map(u => u._id);
      
      // Ghép query tìm kiếm
      query.$or = [
        { userId: { $in: userIds } },
        { transferContent: { $regex: search, $options: 'i' } },
        { orderCode: isNaN(search) ? undefined : parseInt(search) }
      ].filter(cond => cond.orderCode !== undefined || !cond.hasOwnProperty('orderCode'));
    }

    const [deposits, total] = await Promise.all([
      Deposit.find(query)
        .populate('userId', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Deposit.countDocuments(query),
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
 * PUT /api/admin/deposits/:id/confirm
 * Duyệt thủ công lệnh nạp tiền (hoặc chạy giả lập Webhook từ Admin)
 */
const confirmDeposit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deposit = await Deposit.findById(id);

    if (!deposit) {
      return errorResponse(res, 'Không tìm thấy lệnh nạp tiền', 404);
    }

    if (deposit.status !== DEPOSIT_STATUS.PENDING) {
      return errorResponse(res, `Đơn nạp tiền này đã ở trạng thái: ${deposit.status}`, 400);
    }

    // Gọi helper xử lý nạp tiền khớp lệnh
    const result = await processSuccessfulDeposit(
      deposit,
      deposit.amount,
      `MANUAL_ADMIN_${req.user.username.toUpperCase()}`
    );

    // Ghi nhật ký hoạt động
    await logAdminAction(
      req.user._id,
      'CONFIRM_DEPOSIT',
      `Duyệt thủ công đơn nạp #${deposit.orderCode} (Số tiền: ${deposit.amount.toLocaleString()} VNĐ)`
    );

    return successResponse(res, result.deposit, 'Duyệt nạp tiền thành công');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/deposits/:id/reject
 * Hủy/Từ chối lệnh nạp tiền
 */
const rejectDeposit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Hủy bởi Admin' } = req.body;

    const deposit = await Deposit.findById(id);
    if (!deposit) {
      return errorResponse(res, 'Không tìm thấy lệnh nạp tiền', 404);
    }

    if (deposit.status !== DEPOSIT_STATUS.PENDING) {
      return errorResponse(res, 'Chỉ có thể từ chối lệnh nạp đang ở trạng thái Chờ (pending)', 400);
    }

    deposit.status = DEPOSIT_STATUS.CANCELLED;
    deposit.note = `Admin từ chối duyệt. Lý do: ${reason}`;
    await deposit.save();

    // Ghi nhật ký hoạt động
    await logAdminAction(
      req.user._id,
      'REJECT_DEPOSIT',
      `Từ chối đơn nạp #${deposit.orderCode} (Số tiền: ${deposit.amount.toLocaleString()} VNĐ). Lý do: ${reason}`
    );

    // Báo realtime trạng thái hủy cho client
    emitToUser(deposit.userId, 'deposit:cancelled', {
      orderCode: deposit.orderCode,
      message: `Yêu cầu nạp tiền ${deposit.amount.toLocaleString()}đ đã bị từ chối/hủy.`,
    });

    return successResponse(res, deposit, 'Đã từ chối lệnh nạp tiền');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/users/:id/balance
 * Cộng/Trừ số dư tài khoản của User thủ công (Điều chỉnh số dư)
 */
const adjustUserBalance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, description = 'Điều chỉnh số dư bởi Admin' } = req.body;

    if (amount === undefined || isNaN(amount) || amount === 0) {
      return errorResponse(res, 'Số tiền thay đổi không hợp lệ và phải khác 0', 400);
    }

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 'Không tìm thấy người dùng', 404);
    }

    const balanceBefore = user.balance || 0;
    const balanceAfter = balanceBefore + amount;

    if (balanceAfter < 0) {
      return errorResponse(res, 'Số dư tài khoản sau khi trừ không được nhỏ hơn 0', 400);
    }

    // Cập nhật User
    user.balance = balanceAfter;
    await user.save();

    // Lưu biến động số dư
    const transaction = new Transaction({
      userId: user._id,
      type: TRANSACTION_TYPES.ADMIN_ADJUST,
      amount,
      balanceBefore,
      balanceAfter,
      description: `${description} (Thực hiện bởi Admin: ${req.user.username})`,
    });
    await transaction.save();

    // Ghi nhật ký hoạt động
    await logAdminAction(
      req.user._id,
      'ADJUST_BALANCE',
      `Điều chỉnh ví user "${user.username}" (ID: ${user._id}): ${amount > 0 ? '+' : ''}${amount.toLocaleString()} VNĐ (Số dư: ${balanceBefore.toLocaleString()}đ -> ${balanceAfter.toLocaleString()}đ). Lý do: ${description}`
    );

    // Bắn realtime
    emitToUser(user._id, 'balance:updated', {
      balance: balanceAfter,
      message: `Số dư của bạn đã được admin điều chỉnh: ${amount > 0 ? '+' : ''}${amount.toLocaleString()} VNĐ`,
    });

    return successResponse(
      res,
      { userId: user._id, username: user.username, balanceBefore, balanceAfter },
      'Điều chỉnh số dư người dùng thành công'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/deposit-stats
 * Thống kê nạp tiền tổng quan
 */
const getDepositStats = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalDeposits,
      completedDeposits,
      pendingDeposits,
      totalDepositAmountRes,
      todayDepositAmountRes,
    ] = await Promise.all([
      Deposit.countDocuments(),
      Deposit.countDocuments({ status: DEPOSIT_STATUS.COMPLETED }),
      Deposit.countDocuments({ status: DEPOSIT_STATUS.PENDING }),
      
      // Tổng tiền nạp hoàn thành từ trước tới nay
      Deposit.aggregate([
        { $match: { status: DEPOSIT_STATUS.COMPLETED } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),

      // Tổng tiền nạp hoàn thành hôm nay
      Deposit.aggregate([
        { 
          $match: { 
            status: DEPOSIT_STATUS.COMPLETED,
            confirmedAt: { $gte: startOfToday }
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
    ]);

    const totalDepositAmount = totalDepositAmountRes[0]?.total || 0;
    const todayDepositAmount = todayDepositAmountRes[0]?.total || 0;

    return successResponse(res, {
      totalDeposits,
      completedDeposits,
      pendingDeposits,
      totalDepositAmount,
      todayDepositAmount,
    }, 'Lấy thống kê nạp tiền thành công');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDeposits,
  confirmDeposit,
  rejectDeposit,
  adjustUserBalance,
  getDepositStats,
};
