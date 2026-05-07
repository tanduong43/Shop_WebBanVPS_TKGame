// controllers/adminController.js - Admin-specific endpoints
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { ORDER_STATUS } = require('../config/constants');

/**
 * GET /api/admin/dashboard
 * Thống kê tổng quan cho admin dashboard
 */
const getDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      recentOrders,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.countDocuments({ status: ORDER_STATUS.COMPLETED }),
      Order.countDocuments({ status: ORDER_STATUS.PENDING_CONTACT }),
      Order.countDocuments({ status: ORDER_STATUS.CANCELLED }),
      Order.find()
        .populate('userId', 'username email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    // Tính tổng doanh thu từ đơn hàng hoàn thành
    const revenueResult = await Order.aggregate([
      { $match: { status: ORDER_STATUS.COMPLETED } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Doanh thu theo tháng (6 tháng gần nhất)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          status: ORDER_STATUS.COMPLETED,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$totalPrice' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    return successResponse(res, {
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        completedOrders,
        pendingOrders,
        cancelledOrders,
        totalRevenue,
      },
      monthlyRevenue,
      recentOrders,
    }, 'Lấy thống kê thành công');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/users
 * Lấy danh sách tất cả users
 */
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      User.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: users,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/users/:id
 * Vô hiệu hóa tài khoản user (soft delete)
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Không cho phép xóa chính mình
    if (id === req.user._id.toString()) {
      return errorResponse(res, 'Không thể xóa tài khoản của chính bạn', 400);
    }

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 'Không tìm thấy user', 404);
    }

    // Không cho phép xóa admin khác
    if (user.role === 'admin') {
      return errorResponse(res, 'Không thể xóa tài khoản admin', 403);
    }

    // Soft delete: set isActive = false
    user.isActive = false;
    await user.save();

    return successResponse(res, null, 'Vô hiệu hóa tài khoản thành công');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/users/:id/restore
 * Khôi phục tài khoản user
 */
const restoreUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );
    if (!user) return errorResponse(res, 'Không tìm thấy user', 404);
    return successResponse(res, user, 'Khôi phục tài khoản thành công');
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard, getUsers, deleteUser, restoreUser };
