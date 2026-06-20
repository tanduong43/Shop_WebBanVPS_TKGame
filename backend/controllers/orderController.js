// controllers/orderController.js - Quản lý đơn hàng
const Order = require('../models/Order');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const User = require('../models/User'); // Import User if needed to ensure we can update user properly
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const { sendAdminNewOrderEmail, sendCustomerOrderInfoEmail } = require('../utils/sendEmail');

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
    
    // Nạp lại user từ DB để có số dư mới nhất thay vì dùng req.user (cache)
    const user = await User.findById(req.user._id);

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
        vpsInfo: product.vpsInfo,
        accountInfo: product.accountInfo,
        userProvidedData: item.userProvidedData || {},
      };
    });

    // Thực hiện trừ tiền bằng cơ chế Atomic để tránh Race Condition
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id, balance: { $gte: totalPrice } },
      { $inc: { balance: -totalPrice } },
      { new: true }
    );

    if (!updatedUser) {
      return errorResponse(res, 'Số dư không đủ hoặc đã bị trừ từ giao dịch khác!', 400);
    }

    const balanceBefore = updatedUser.balance + totalPrice;
    const balanceAfter = updatedUser.balance;

    // Tạo đơn hàng (Chờ xử lý)
    const order = await Order.create({
      userId: user._id,
      items: orderItems,
      totalPrice,
      contactInfo: { username: user.username, email: user.email },
      status: 'pending_contact' // Tương đương "Chờ xử lý" trên frontend
    });

    // Ghi nhận lịch sử giao dịch (Transaction)
    await Transaction.create({
      userId: user._id,
      type: 'purchase',
      amount: -totalPrice,
      balanceBefore,
      balanceAfter: balanceAfter,
      description: `Thanh toán đơn hàng #${order._id.toString().slice(-8).toUpperCase()}`,
      referenceId: order._id,
      referenceModel: 'Order'
    });

    // Gửi email thông báo cho Admin
    sendAdminNewOrderEmail(order, user).catch(err => {
      console.error('Lỗi khi gửi email thông báo đơn hàng cho admin:', err);
    });

    return successResponse(
      res,
      { order, newBalance: balanceAfter },
      'Thanh toán thành công! Đơn hàng của bạn đang được xử lý.',
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
    const { page = 1, limit = 10, type } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(parseInt(limit), 50);
    const skip = (pageNum - 1) * limitNum;

    const filter = { userId: req.user._id };
    if (type) filter['items.type'] = type;

    const [orders, total] = await Promise.all([
      Order.find(filter)
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
 * GET /api/orders  [Admin only]
 * Lấy tất cả đơn hàng
 */
const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status) filter.status = status;
    if (type) {
      filter['items.type'] = type;
    } else {
      filter['items.type'] = { $ne: 'boosting' };
    }

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
    const { status, adminNote, itemsCredentials } = req.body;
    const update = { status };
    if (adminNote !== undefined) update.adminNote = adminNote;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return errorResponse(res, 'Không tìm thấy đơn hàng', 404);
    }

    const isUpdate = (order.status === 'completed' && status === 'completed');

    order.status = status;
    if (adminNote !== undefined) order.adminNote = adminNote;

    // Tự động tính ngày hết hạn cho các đơn Treo Thuê khi chuyển sang Đang cày (processing)
    if (status === 'processing') {
      order.items.forEach(item => {
        if (item.type === 'boosting') {
          // Nếu chưa có expiresAt thì mới set (để tránh bị reset khi admin ấn cập nhật lại)
          if (!item.credentials.expiresAt) {
            const months = item.quantity || 1; // quantity chính là số tháng khách mua
            const expiresDate = new Date();
            expiresDate.setMonth(expiresDate.getMonth() + months);
            item.credentials.expiresAt = expiresDate;
          }
        }
      });
      order.markModified('items');
    }

    // Cập nhật credentials cho từng sản phẩm trong đơn hàng (nếu có truyền lên)
    if (itemsCredentials && Array.isArray(itemsCredentials)) {
      itemsCredentials.forEach((cred) => {
        const item = order.items.id(cred.itemId);
        if (item) {
          // Gán từng field để Mongoose tự bắt thay đổi, hoặc dùng markModified
          if (cred.credentials.ip !== undefined) item.credentials.ip = cred.credentials.ip;
          if (cred.credentials.username !== undefined) item.credentials.username = cred.credentials.username;
          if (cred.credentials.password !== undefined) item.credentials.password = cred.credentials.password;
          if (cred.credentials.server !== undefined) item.credentials.server = cred.credentials.server;
          if (cred.credentials.expiresAt !== undefined) item.credentials.expiresAt = cred.credentials.expiresAt;
          if (cred.credentials.cycle !== undefined) item.credentials.cycle = cred.credentials.cycle;

          // Nếu có thiết lập IP hoặc username mà chưa có createdAt, thì coi như vừa tạo
          if (!item.credentials.createdAt && (cred.credentials.ip || cred.credentials.username)) {
            item.credentials.createdAt = new Date();
          }
        }
      });
      order.markModified('items');
    }

    await order.save();
    
    // Nạp lại thông tin user để trả về
    await order.populate('userId', 'username email');

    if (req.body.sendEmail) {
      sendCustomerOrderInfoEmail(order, order.userId, isUpdate).catch(err => {
        console.error('Lỗi khi gửi email thông tin đơn hàng cho khách:', err);
      });
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
