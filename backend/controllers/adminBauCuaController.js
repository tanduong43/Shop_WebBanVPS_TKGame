// controllers/adminBauCuaController.js - Admin quản lý phòng Bầu Cua
const BauCuaRoom = require('../models/BauCuaRoom');
const BauCuaRound = require('../models/BauCuaRound');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { startRoom, stopRoom } = require('./bauCuaGameEngine');

/**
 * GET /api/admin/baucua/rooms
 * Lấy tất cả phòng (kể cả inactive)
 */
const getAllRooms = async (req, res, next) => {
  try {
    const rooms = await BauCuaRoom.find().sort({ createdAt: -1 }).lean();
    return successResponse(res, rooms, 'Lấy danh sách phòng thành công');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/baucua/rooms
 * Tạo phòng mới
 */
const createRoom = async (req, res, next) => {
  try {
    const { name, description, minBet = 1000, maxBet = 500000 } = req.body;
    if (!name) return errorResponse(res, 'Tên phòng là bắt buộc', 400);
    if (minBet < 1000) return errorResponse(res, 'Cược tối thiểu phải >= 1,000đ', 400);
    if (maxBet > 500000) return errorResponse(res, 'Cược tối đa phải <= 500,000đ', 400);
    if (minBet > maxBet) return errorResponse(res, 'Cược tối thiểu không được lớn hơn tối đa', 400);

    const room = await BauCuaRoom.create({
      name, description, minBet, maxBet,
      isActive: false,
      createdBy: req.user._id,
    });
    return successResponse(res, room, 'Tạo phòng thành công', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/baucua/rooms/:id
 * Cập nhật thông tin phòng
 */
const updateRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, minBet, maxBet } = req.body;

    const room = await BauCuaRoom.findById(id);
    if (!room) return errorResponse(res, 'Phòng không tồn tại', 404);

    if (name) room.name = name;
    if (description !== undefined) room.description = description;
    if (minBet !== undefined) {
      if (minBet < 1000) return errorResponse(res, 'Cược tối thiểu phải >= 1,000đ', 400);
      room.minBet = minBet;
    }
    if (maxBet !== undefined) {
      if (maxBet > 500000) return errorResponse(res, 'Cược tối đa phải <= 500,000đ', 400);
      room.maxBet = maxBet;
    }

    await room.save();
    return successResponse(res, room, 'Cập nhật phòng thành công');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/baucua/rooms/:id/toggle
 * Bật/Tắt phòng (tự động start/stop game loop)
 */
const toggleRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const room = await BauCuaRoom.findById(id);
    if (!room) return errorResponse(res, 'Phòng không tồn tại', 404);

    room.isActive = !room.isActive;
    await room.save();

    if (room.isActive) {
      await startRoom(id);
    } else {
      stopRoom(id);
    }

    return successResponse(res, room, `Phòng đã được ${room.isActive ? 'bật' : 'tắt'}`);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/baucua/rooms/:id
 * Xóa phòng
 */
const deleteRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const room = await BauCuaRoom.findById(id);
    if (!room) return errorResponse(res, 'Phòng không tồn tại', 404);

    if (room.isActive) {
      stopRoom(id);
    }

    await BauCuaRound.deleteMany({ roomId: id });
    await BauCuaRoom.findByIdAndDelete(id);

    return successResponse(res, null, 'Đã xóa phòng thành công');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/baucua/rooms/:id/history
 * Xem lịch sử các ván của phòng (admin view đầy đủ)
 */
const getRoomHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    const [history, total] = await Promise.all([
      BauCuaRound.find({ roomId: id, status: 'finished' })
        .sort({ roundNumber: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      BauCuaRound.countDocuments({ roomId: id, status: 'finished' }),
    ]);

    return res.json({
      success: true,
      data: history,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/baucua/stats
 * Thống kê tổng quan Bầu Cua
 */
const getStats = async (req, res, next) => {
  try {
    const [totalRooms, activeRooms, totalRounds, volumeRes] = await Promise.all([
      BauCuaRoom.countDocuments(),
      BauCuaRoom.countDocuments({ isActive: true }),
      BauCuaRound.countDocuments({ status: 'finished' }),
      BauCuaRoom.aggregate([{ $group: { _id: null, total: { $sum: '$totalVolume' } } }]),
    ]);

    return successResponse(res, {
      totalRooms,
      activeRooms,
      totalRounds,
      totalVolume: volumeRes[0]?.total || 0,
    }, 'Lấy thống kê thành công');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/baucua/rooms/:id/stats
 * Thống kê thắng/thua của từng user trong phòng
 */
const getRoomStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, search, sortBy } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(parseInt(limit, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    // Check if room exists
    const room = await BauCuaRoom.findById(id);
    if (!room) return errorResponse(res, 'Phòng không tồn tại', 404);

    let sortStage = { netProfit: -1 }; // Mặc định thắng nhiều nhất
    if (sortBy === 'profit_asc') {
      sortStage = { netProfit: 1 }; // Thua nhiều nhất
    } else if (sortBy === 'bet_desc') {
      sortStage = { totalBet: -1 }; // Cược nhiều nhất
    } else if (sortBy === 'win_desc') {
      sortStage = { totalWin: -1 }; // Thắng nhiều nhất
    } else if (sortBy === 'rounds_desc') {
      sortStage = { roundsPlayed: -1 }; // Chơi nhiều ván nhất
    }

    const aggregationPipeline = [
      { $match: { roomId: room._id, status: 'finished' } },
      { $unwind: '$bets' },
      { $match: { 'bets.isBot': false } },
      {
        $group: {
          _id: '$bets.userId',
          totalBet: { $sum: '$bets.amount' },
          totalWin: { $sum: '$bets.payout' },
          netProfit: { $sum: '$bets.profit' },
          roundsPlayed: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          userId: '$_id',
          username: '$userInfo.username',
          email: '$userInfo.email',
          totalBet: 1,
          totalWin: 1,
          netProfit: 1,
          roundsPlayed: 1
        }
      }
    ];

    if (search) {
      aggregationPipeline.push({
        $match: {
          $or: [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    aggregationPipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $sort: sortStage },
          { $skip: skip },
          { $limit: limitNum }
        ]
      }
    });

    const result = await BauCuaRound.aggregate(aggregationPipeline);
    const total = result[0]?.metadata[0]?.total || 0;
    const data = result[0]?.data || [];

    return res.json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllRooms,
  createRoom,
  updateRoom,
  toggleRoom,
  deleteRoom,
  getRoomHistory,
  getStats,
  getRoomStats
};
