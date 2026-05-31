// controllers/wheelController.js - Xử lý tính năng quay thưởng của User
const SpinWheel = require('../models/SpinWheel');
const Prize = require('../models/Prize');
const SpinHistory = require('../models/SpinHistory');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { TRANSACTION_TYPES } = require('../config/constants');
const { getIO } = require('../config/socket');

/**
 * GET /api/spin-wheels
 * Lấy danh sách các vòng quay đang hoạt động
 */
const getAllWheels = async (req, res, next) => {
  try {
    const wheels = await SpinWheel.find({ isActive: true }).lean();
    return successResponse(res, wheels, 'Lấy danh sách vòng quay thành công');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/spin-wheels/:id
 * Lấy chi tiết vòng quay và danh sách các phần quà của vòng quay đó
 */
const getWheelDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const wheel = await SpinWheel.findById(id).lean();

    if (!wheel || !wheel.isActive) {
      return errorResponse(res, 'Vòng quay không tồn tại hoặc đã tạm đóng', 404);
    }

    // Lấy tất cả các phần quà đang hoạt động của vòng quay này
    const prizes = await Prize.find({ wheelId: id, isActive: true })
      .sort({ createdAt: 1 })
      .lean();

    return successResponse(res, { wheel, prizes }, 'Lấy chi tiết vòng quay thành công');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/spin-wheels/:id/spin
 * Thực hiện quay thưởng (Backend quyết định ngẫu nhiên theo tỷ lệ trọng số - Weighted Random)
 */
const spinWheel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // 1. Kiểm tra vòng quay tồn tại
    const wheel = await SpinWheel.findById(id);
    if (!wheel || !wheel.isActive) {
      return errorResponse(res, 'Vòng quay không hoạt động', 400);
    }

    // 2. Kiểm tra số dư người dùng
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return errorResponse(res, 'Tài khoản của bạn đã bị vô hiệu hóa hoặc không hợp lệ', 403);
    }

    if (user.balance < wheel.price) {
      return errorResponse(res, 'Số dư tài khoản không đủ để thực hiện lượt quay này', 400);
    }

    // 3. Lấy tất cả các phần quà đang hoạt động của vòng quay
    const allActivePrizes = await Prize.find({ wheelId: id, isActive: true }).sort({ createdAt: 1 });

    // Lọc ra các phần quà còn hàng (stock > 0 hoặc stock = -1 là vô hạn)
    const availablePrizes = allActivePrizes.filter(
      (p) => p.stock > 0 || p.stock === -1
    );

    if (availablePrizes.length === 0) {
      return errorResponse(res, 'Vòng quay này hiện không có phần thưởng khả dụng (hết quà)', 400);
    }

    // 4. THUẬT TOÁN WEIGHTED RANDOM (Ngẫu nhiên theo trọng số tỷ lệ %)
    const totalWeight = availablePrizes.reduce((sum, prize) => sum + prize.winRate, 0);

    if (totalWeight <= 0) {
      return errorResponse(res, 'Tổng tỷ lệ cấu hình của các phần quà khả dụng phải lớn hơn 0%', 400);
    }

    const randomValue = Math.random() * totalWeight;
    let accumulatedWeight = 0;
    let winningPrize = null;

    for (const prize of availablePrizes) {
      accumulatedWeight += prize.winRate;
      if (randomValue <= accumulatedWeight) {
        winningPrize = prize;
        break;
      }
    }

    // Phòng ngừa lỗi kỹ thuật: Nếu không tìm thấy (do làm tròn số), chọn quà cuối cùng
    if (!winningPrize) {
      winningPrize = availablePrizes[availablePrizes.length - 1];
    }

    // 5. THANH TOÁN: Trừ tiền User
    const balanceBefore = user.balance;
    const balanceAfter = balanceBefore - wheel.price;
    user.balance = balanceAfter;
    await user.save();

    // 6. CẬP NHẬT KHO: Giảm stock của phần quà trúng giải (nếu không phải vô hạn)
    if (winningPrize.stock > 0) {
      winningPrize.stock -= 1;
      await winningPrize.save();
    }

    // 7. Ghi nhận nhật ký biến động số dư (Transaction)
    const transaction = new Transaction({
      userId: user._id,
      type: TRANSACTION_TYPES.PURCHASE, // 'purchase'
      amount: -wheel.price,
      balanceBefore,
      balanceAfter,
      description: `Chi phí quay thưởng vòng "${wheel.name}" (Mã giải: ${winningPrize.name})`,
    });
    await transaction.save();

    // 8. Ghi nhận lịch sử quay thưởng (SpinHistory)
    const spinHistory = new SpinHistory({
      userId: user._id,
      wheelId: wheel._id,
      prizeId: winningPrize._id,
      price: wheel.price,
    });
    await spinHistory.save();

    // Tìm góc/vị trí trúng thưởng trên vòng tròn hiển thị
    // index khớp với danh sách phần quà đang hoạt động (allActivePrizes) vẽ trên Canvas
    const segmentIndex = allActivePrizes.findIndex(
      (p) => p._id.toString() === winningPrize._id.toString()
    );

    // 9. REALTIME SOCKET.IO: Phát loa thông báo nếu trúng giải lớn (Jackpot)
    if (winningPrize.isJackpot) {
      try {
        const io = getIO();
        io.emit('jackpot:won', {
          username: user.username,
          prizeName: winningPrize.name,
          wheelName: wheel.name,
          amount: wheel.price,
        });
      } catch (err) {
        console.error('⚠️ Realtime emit error:', err.message);
      }
    }

    return successResponse(
      res,
      {
        prize: {
          _id: winningPrize._id,
          name: winningPrize.name,
          color: winningPrize.color,
          description: winningPrize.description,
          isJackpot: winningPrize.isJackpot,
        },
        segmentIndex, // Trả về index của phần quà để frontend quay đúng góc
        newBalance: balanceAfter,
      },
      'Quay thưởng thành công'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/spin-wheels/my/history
 * Lấy lịch sử quay của cá nhân người dùng
 */
const getMySpinHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(parseInt(limit), 50);
    const skip = (pageNum - 1) * limitNum;

    const [history, total] = await Promise.all([
      SpinHistory.find({ userId: req.user._id })
        .populate('wheelId', 'name')
        .populate('prizeId', 'name color isJackpot description')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      SpinHistory.countDocuments({ userId: req.user._id }),
    ]);

    return res.json({
      success: true,
      data: history,
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

module.exports = {
  getAllWheels,
  getWheelDetails,
  spinWheel,
  getMySpinHistory,
};
