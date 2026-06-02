// controllers/bauCuaController.js - HTTP Endpoints cho User chơi Bầu Cua
const BauCuaRoom = require('../models/BauCuaRoom');
const BauCuaRound = require('../models/BauCuaRound');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { BAUCUA_STATUS, BAUCUA_SYMBOLS, BAUCUA_LIMITS } = require('../config/constants');
const { getIO, emitToUser } = require('../config/socket');

/**
 * GET /api/baucua/rooms
 * Lấy danh sách phòng đang hoạt động
 */
const getRooms = async (req, res, next) => {
  try {
    const rooms = await BauCuaRoom.find({ isActive: true }).lean();
    return successResponse(res, rooms, 'Lấy danh sách phòng thành công');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/baucua/rooms/:roomId/state
 * Lấy trạng thái ván hiện tại của phòng
 */
const getRoomState = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const room = await BauCuaRoom.findById(roomId).lean();
    if (!room) return errorResponse(res, 'Phòng không tồn tại', 404);

    // Lấy ván đang diễn ra (chưa finished)
    const currentRound = await BauCuaRound.findOne({
      roomId,
      status: { $ne: BAUCUA_STATUS.FINISHED },
    }).sort({ roundNumber: -1 }).lean();

    return successResponse(res, { room, currentRound }, 'Lấy trạng thái phòng thành công');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/baucua/rooms/:roomId/bet
 * Đặt cược vào ván hiện tại
 */
const placeBet = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { symbol, amount } = req.body;
    const userId = req.user._id;

    // Validate symbol
    if (!BAUCUA_SYMBOLS.includes(symbol)) {
      return errorResponse(res, `Ký hiệu không hợp lệ. Chọn: ${BAUCUA_SYMBOLS.join(', ')}`, 400);
    }

    // Validate amount
    const amt = parseInt(amount);
    if (isNaN(amt) || amt < BAUCUA_LIMITS.MIN_BET || amt > BAUCUA_LIMITS.MAX_BET) {
      return errorResponse(res, `Số tiền cược phải từ ${BAUCUA_LIMITS.MIN_BET.toLocaleString()}đ đến ${BAUCUA_LIMITS.MAX_BET.toLocaleString()}đ`, 400);
    }

    // Kiểm tra phòng
    const room = await BauCuaRoom.findById(roomId);
    if (!room || !room.isActive) return errorResponse(res, 'Phòng không hoạt động', 400);

    // Validate giới hạn phòng
    if (amt < room.minBet) return errorResponse(res, `Cược tối thiểu phòng này là ${room.minBet.toLocaleString()}đ`, 400);
    if (amt > room.maxBet) return errorResponse(res, `Cược tối đa phòng này là ${room.maxBet.toLocaleString()}đ`, 400);

    // Lấy ván đang mở cược (mới nhất — tránh trúng ván WAITING cũ bị kẹt)
    const round = await BauCuaRound.findOne({ roomId, status: BAUCUA_STATUS.WAITING })
      .sort({ roundNumber: -1 });
    if (!round) return errorResponse(res, 'Hiện không có ván đang nhận cược. Vui lòng chờ ván mới.', 400);

    // Kiểm tra số dư
    const user = await User.findById(userId);
    if (!user || user.balance < amt) {
      return errorResponse(res, 'Số dư không đủ để đặt cược', 400);
    }

    // Trừ tiền ngay khi đặt cược (Atomic)
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, balance: { $gte: amt } },
      { $inc: { balance: -amt } },
      { new: true }
    );
    if (!updatedUser) return errorResponse(res, 'Số dư không đủ (có thể đã cược trước đó)', 400);

    // Lưu lệnh cược
    const bet = {
      userId,
      username: user.username,
      symbol,
      amount: amt,
      isBot: false,
    };
    await BauCuaRound.findByIdAndUpdate(round._id, { $push: { bets: bet } });

    // Broadcast tới tất cả trong phòng
    const io = getIO();
    io.to(`baucua:${roomId}`).emit('baucua:bet_placed', {
      roundId: round._id,
      bet,
      timestamp: new Date(),
    });

    emitToUser(userId, 'balance:updated', { balance: updatedUser.balance });

    return successResponse(res, {
      bet,
      newBalance: updatedUser.balance,
    }, 'Đặt cược thành công');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/baucua/rooms/:roomId/history
 * Lịch sử ván của phòng (20 ván gần nhất)
 */
const getRoomHistory = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { limit = 20 } = req.query;
    const history = await BauCuaRound.find({ roomId, status: BAUCUA_STATUS.FINISHED })
      .sort({ roundNumber: -1 })
      .limit(Math.min(parseInt(limit), 50))
      .select('roundNumber result gameMode totalRealBets houseProfit createdAt')
      .lean();
    return successResponse(res, history, 'Lấy lịch sử phòng thành công');
  } catch (err) {
    next(err);
  }
};

module.exports = { getRooms, getRoomState, placeBet, getRoomHistory };
