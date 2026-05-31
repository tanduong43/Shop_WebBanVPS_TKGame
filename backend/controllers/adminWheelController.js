// controllers/adminWheelController.js - Xử lý tính năng quản trị vòng quay cho Admin
const SpinWheel = require('../models/SpinWheel');
const Prize = require('../models/Prize');
const SpinHistory = require('../models/SpinHistory');
const AdminLog = require('../models/AdminLog');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Helper tự động lưu audit logs của Admin
const logAdminAction = async (adminId, action, details) => {
  try {
    const auditLog = new AdminLog({ adminId, action, details });
    await auditLog.save();
  } catch (err) {
    console.error('❌ Failed to write admin audit log:', err.message);
  }
};

/* ─── LẤY DỮ LIỆU DÀNH CHO ADMIN ────────────────────────────────────────── */

const getAllWheelsAdmin = async (req, res, next) => {
  try {
    const wheels = await SpinWheel.find().lean();
    return successResponse(res, wheels, 'Lấy danh sách vòng quay thành công');
  } catch (error) {
    next(error);
  }
};

const getWheelDetailsAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const wheel = await SpinWheel.findById(id).lean();
    
    if (!wheel) {
      return errorResponse(res, 'Không tìm thấy vòng quay', 404);
    }

    const prizes = await Prize.find({ wheelId: id }).sort({ createdAt: 1 }).lean();

    return successResponse(res, { wheel, prizes }, 'Lấy chi tiết vòng quay thành công');
  } catch (error) {
    next(error);
  }
};

/* ─── CRUD VÒNG QUAY (SPIN WHEELS) ────────────────────────────────────────── */

const createWheel = async (req, res, next) => {
  try {
    const { name, price, description, isActive } = req.body;
    
    if (!name || price === undefined || price < 0) {
      return errorResponse(res, 'Tên vòng quay và giá tiền hợp lệ là bắt buộc', 400);
    }

    const wheel = new SpinWheel({ name, price, description, isActive });
    await wheel.save();

    await logAdminAction(req.user._id, 'CREATE_SPIN_WHEEL', `Tạo vòng quay "${name}" với giá ${price.toLocaleString()}đ`);
    return successResponse(res, wheel, 'Tạo vòng quay thành công', 201);
  } catch (error) {
    next(error);
  }
};

const updateWheel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, price, description, isActive } = req.body;

    const wheel = await SpinWheel.findById(id);
    if (!wheel) {
      return errorResponse(res, 'Không tìm thấy vòng quay', 404);
    }

    if (name) wheel.name = name;
    if (price !== undefined) {
      if (price < 0) return errorResponse(res, 'Giá tiền không được âm', 400);
      wheel.price = price;
    }
    if (description !== undefined) wheel.description = description;
    if (isActive !== undefined) wheel.isActive = isActive;

    await wheel.save();

    await logAdminAction(req.user._id, 'UPDATE_SPIN_WHEEL', `Cấu hình vòng quay "${wheel.name}" (Giá: ${wheel.price.toLocaleString()}đ, Hoạt động: ${wheel.isActive})`);
    return successResponse(res, wheel, 'Cập nhật vòng quay thành công');
  } catch (error) {
    next(error);
  }
};

const deleteWheel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const wheel = await SpinWheel.findById(id);
    if (!wheel) {
      return errorResponse(res, 'Không tìm thấy vòng quay', 404);
    }

    const wheelName = wheel.name;
    
    // Xóa vòng quay
    await SpinWheel.findByIdAndDelete(id);
    // Xóa kèm các phần quà thuộc vòng quay đó
    await Prize.deleteMany({ wheelId: id });

    await logAdminAction(req.user._id, 'DELETE_SPIN_WHEEL', `Xóa vòng quay "${wheelName}" và toàn bộ phần quà của nó`);
    return successResponse(res, null, 'Xóa vòng quay và phần quà liên quan thành công');
  } catch (error) {
    next(error);
  }
};


/* ─── CRUD PHẦN THƯỞNG (PRIZES) ───────────────────────────────────────────── */

const createPrize = async (req, res, next) => {
  try {
    const { wheelId, name, description, winRate, stock, color, isActive, isJackpot } = req.body;

    if (!wheelId || !name || winRate === undefined || stock === undefined) {
      return errorResponse(res, 'Thông tin phần thưởng (tên, tỷ lệ %, số lượng) là bắt buộc', 400);
    }

    const wheel = await SpinWheel.findById(wheelId);
    if (!wheel) {
      return errorResponse(res, 'Vòng quay không tồn tại', 404);
    }

    const prize = new Prize({
      wheelId,
      name,
      description,
      winRate,
      stock,
      color,
      isActive,
      isJackpot,
    });
    await prize.save();

    await logAdminAction(req.user._id, 'CREATE_PRIZE', `Tạo quà "${name}" cho vòng "${wheel.name}" (Tỷ lệ: ${winRate}%, Stock: ${stock})`);
    return successResponse(res, prize, 'Tạo phần quà thành công', 201);
  } catch (error) {
    next(error);
  }
};

const updatePrize = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, winRate, stock, color, isActive, isJackpot } = req.body;

    const prize = await Prize.findById(id).populate('wheelId', 'name');
    if (!prize) {
      return errorResponse(res, 'Không tìm thấy phần quà', 404);
    }

    if (name) prize.name = name;
    if (description !== undefined) prize.description = description;
    if (winRate !== undefined) {
      if (winRate < 0 || winRate > 100) return errorResponse(res, 'Tỷ lệ trúng phải nằm trong khoảng 0% - 100%', 400);
      prize.winRate = winRate;
    }
    if (stock !== undefined) prize.stock = stock;
    if (color) prize.color = color;
    if (isActive !== undefined) prize.isActive = isActive;
    if (isJackpot !== undefined) prize.isJackpot = isJackpot;

    await prize.save();

    await logAdminAction(req.user._id, 'UPDATE_PRIZE', `Sửa quà "${prize.name}" của vòng "${prize.wheelId?.name}" (Tỷ lệ: ${prize.winRate}%, Stock: ${prize.stock}, Hoạt động: ${prize.isActive})`);
    return successResponse(res, prize, 'Cập nhật phần quà thành công');
  } catch (error) {
    next(error);
  }
};

const deletePrize = async (req, res, next) => {
  try {
    const { id } = req.params;
    const prize = await Prize.findById(id).populate('wheelId', 'name');
    if (!prize) {
      return errorResponse(res, 'Không tìm thấy phần quà', 404);
    }

    const prizeName = prize.name;
    const wheelName = prize.wheelId?.name || 'Vòng quay ẩn';

    await Prize.findByIdAndDelete(id);

    await logAdminAction(req.user._id, 'DELETE_PRIZE', `Xóa phần quà "${prizeName}" của vòng "${wheelName}"`);
    return successResponse(res, null, 'Xóa phần quà thành công');
  } catch (error) {
    next(error);
  }
};


/* ─── LỊCH SỬ QUAY TOÀN DÂN ──────────────────────────────────────────────── */

const getAllSpinHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    let query = {};

    // Tìm kiếm theo tên user trúng giải
    if (search) {
      const User = require('../models/User');
      const matchedUsers = await User.find({
        username: { $regex: search, $options: 'i' },
      }).select('_id');
      const userIds = matchedUsers.map((u) => u._id);
      query.userId = { $in: userIds };
    }

    const [history, total] = await Promise.all([
      SpinHistory.find(query)
        .populate('userId', 'username email')
        .populate('wheelId', 'name')
        .populate('prizeId', 'name color isJackpot')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      SpinHistory.countDocuments(query),
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
  getAllWheelsAdmin,
  getWheelDetailsAdmin,
  createWheel,
  updateWheel,
  deleteWheel,
  createPrize,
  updatePrize,
  deletePrize,
  getAllSpinHistory,
};
