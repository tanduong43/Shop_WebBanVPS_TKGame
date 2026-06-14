// models/Order.js - Schema đơn hàng
const mongoose = require('mongoose');
const { ORDER_STATUS } = require('../config/constants');

// Sub-schema cho từng sản phẩm trong đơn hàng
const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },       // Snapshot tên sản phẩm tại thời điểm đặt
  type: { type: String, required: true },       // Snapshot loại sản phẩm
  price: { type: Number, required: true },      // Snapshot giá tại thời điểm đặt
  quantity: { type: Number, required: true, min: 1 },
  // Snapshot cấu hình sản phẩm
  vpsInfo: { type: mongoose.Schema.Types.Mixed },
  accountInfo: { type: mongoose.Schema.Types.Mixed },
  // Thông tin quản lý dịch vụ do Admin cấp phát
  credentials: {
    ip: { type: String, default: '' },
    username: { type: String, default: '' },
    password: { type: String, default: '' },
    server: { type: String, default: '' },
    createdAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    cycle: { type: String, default: '1 Tháng' }
  },
  // Thông tin khách hàng tự cung cấp (Dành cho dịch vụ Treo Thuê)
  userProvidedData: {
    username: { type: String, default: '' },
    password: { type: String, default: '' },
    server: { type: String, default: '' },
    note: { type: String, default: '' }
  }
}, { _id: true }); // Bật _id cho orderItem để có ID định danh khi Admin cập nhật riêng lẻ từng item

const orderSchema = new mongoose.Schema(
  {
    // Người đặt hàng (có thể null nếu chưa đăng nhập – guest order)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: 'Đơn hàng phải có ít nhất 1 sản phẩm',
      },
    },
    totalPrice: {
      type: Number,
      required: true,
      min: [0, 'Tổng tiền không được âm'],
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING_CONTACT,
    },
    // Tin nhắn được gửi sang Zalo
    zaloMessage: {
      type: String,
      default: '',
    },
    // Ghi chú từ admin khi xử lý đơn
    adminNote: {
      type: String,
      default: '',
    },
    // Thông tin liên hệ người đặt (snapshot)
    contactInfo: {
      username: String,
      email: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index để query nhanh
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
