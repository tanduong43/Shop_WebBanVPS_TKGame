// controllers/orderController.js - Quản lý đơn hàng
const Order = require('../models/Order');
const Product = require('../models/Product');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

/**
 * Tạo nội dung tin nhắn Zalo từ đơn hàng
 */
const buildZaloMessage = (order, user) => {
  const itemLines = order.items
    .map((item) => `  - ${item.name} x${item.quantity}: ${item.price.toLocaleString('vi-VN')}đ`)
    .join('\n');

  return (
    `🛒 ĐƠN HÀNG MỚI\n` +
    `Mã đơn: ${order._id}\n` +
    `Khách hàng: ${user.username} (${user.email})\n` +
    `─────────────────\n` +
    `${itemLines}\n` +
    `─────────────────\n` +
    `💰 Tổng tiền: ${order.totalPrice.toLocaleString('vi-VN')}đ\n` +
    `Vui lòng xác nhận và xử lý đơn hàng cho tôi. Cảm ơn!`
  );
};

/**
 * POST /api/orders
 * Tạo đơn hàng mới (cần đăng nhập)
 */
const createOrder = async (req, res, next) => {
  try {
    const { items } = req.body; // [{ productId, quantity }]
    const user = req.user;

    // Lấy tất cả sản phẩm trong đơn hàng
    const productIds = items.map((i) => i.productId);
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    });

    // Kiểm tra tất cả sản phẩm tồn tại
    if (products.length !== productIds.length) {
      return errorResponse(res, 'Một hoặc nhiều sản phẩm không tồn tại hoặc đã ngừng bán', 400);
    }

    // Build order items với snapshot giá tại thời điểm đặt
    const productMap = {};
    products.forEach((p) => { productMap[p._id.toString()] = p; });

    let totalPrice = 0;
    const orderItems = items.map((item) => {
      const product = productMap[item.productId];
      const subtotal = product.price * item.quantity;
      totalPrice += subtotal;
      return {
        productId: product._id,
        name: product.name,
        type: product.type,
        price: product.price,
        quantity: item.quantity,
      };
    });

    // Tạo nội dung Zalo message
    const tempOrder = { _id: 'pending', items: orderItems, totalPrice };
    const zaloMessage = buildZaloMessage(tempOrder, user);

    // Lưu đơn hàng vào DB
    const order = await Order.create({
      userId: user._id,
      items: orderItems,
      totalPrice,
      zaloMessage,
      contactInfo: { username: user.username, email: user.email },
    });

    // Cập nhật zaloMessage với orderId thực tế
    const finalZaloMessage = buildZaloMessage(order, user);
    order.zaloMessage = finalZaloMessage;
    await order.save();

    // Tạo Zalo redirect URL
    const zaloPhone = process.env.ZALO_PHONE || '0900000000';
    const encodedMessage = encodeURIComponent(finalZaloMessage);
    const zaloUrl = `https://zalo.me/${zaloPhone}?text=${encodedMessage}`;

    return successResponse(
      res,
      { order, zaloUrl },
      'Đặt hàng thành công! Vui lòng liên hệ admin qua Zalo để xác nhận.',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/my
 * Lịch sử đơn hàng của người dùng hiện tại
 */
const getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(parseInt(limit), 50);
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments({ userId: req.user._id }),
    ]);

    return paginatedResponse(res, orders, {
      page: pageNum, limit: limitNum, total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders  [Admin only]
 * Lấy tất cả đơn hàng
 */
const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('userId', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return paginatedResponse(res, orders, {
      page: pageNum, limit: limitNum, total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/orders/:id/status  [Admin only]
 * Cập nhật trạng thái đơn hàng
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    const update = { status };
    if (adminNote !== undefined) update.adminNote = adminNote;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    ).populate('userId', 'username email');

    if (!order) {
      return errorResponse(res, 'Không tìm thấy đơn hàng', 404);
    }

    return successResponse(res, order, 'Cập nhật trạng thái đơn hàng thành công');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/:id
 * Lấy chi tiết 1 đơn hàng (user chỉ xem được đơn của mình)
 */
const getOrderById = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id };
    // Nếu không phải admin, chỉ xem được đơn của mình
    if (req.user.role !== 'admin') {
      filter.userId = req.user._id;
    }

    const order = await Order.findOne(filter).populate('userId', 'username email');
    if (!order) {
      return errorResponse(res, 'Không tìm thấy đơn hàng', 404);
    }

    return successResponse(res, order);
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, getMyOrders, getAllOrders, updateOrderStatus, getOrderById };
