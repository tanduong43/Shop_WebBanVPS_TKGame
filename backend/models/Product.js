// models/Product.js - Schema sản phẩm (game account + VPS)
const mongoose = require('mongoose');
const { PRODUCT_TYPES } = require('../config/constants');

// Sub-schema thông tin tài khoản game
const accountInfoSchema = new mongoose.Schema({
  server: { type: String, default: '' },        // Server game
  level: { type: Number, default: 0 },          // Level nhân vật
  characters: { type: String, default: '' },    // Danh sách nhân vật
  items: { type: String, default: '' },         // Vật phẩm nổi bật
  loginMethod: { type: String, default: '' },   // Cách đăng nhập (email/phone)
  extras: { type: String, default: '' },        // Thông tin thêm
}, { _id: false });

// Sub-schema thông tin VPS
const vpsInfoSchema = new mongoose.Schema({
  ram: { type: String, default: '' },           // VD: "4GB"
  cpu: { type: String, default: '' },           // VD: "2 vCPU"
  storage: { type: String, default: '' },       // VD: "80GB SSD"
  bandwidth: { type: String, default: '' },     // VD: "Unlimited"
  os: { type: String, default: '' },            // VD: "Ubuntu 22.04"
  location: { type: String, default: '' },      // VD: "Singapore"
  uptime: { type: String, default: '99.9%' },  // Uptime SLA
}, { _id: false });

const productSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(PRODUCT_TYPES),
      required: [true, 'Loại sản phẩm là bắt buộc'],
    },
    name: {
      type: String,
      required: [true, 'Tên sản phẩm là bắt buộc'],
      trim: true,
      maxlength: [100, 'Tên sản phẩm không quá 100 ký tự'],
    },
    price: {
      type: Number,
      required: [true, 'Giá là bắt buộc'],
      min: [0, 'Giá không được âm'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [1000, 'Mô tả không quá 1000 ký tự'],
    },
    stock: {
      type: Number,
      default: 1,
      min: [0, 'Số lượng không được âm'],
    },
    isActive: {
      type: Boolean,
      default: true, // Sản phẩm active sẽ hiển thị trên frontend
    },
    image: {
      type: String,
      default: '', // URL ảnh sản phẩm (optional)
    },
    // Thông tin chi tiết theo loại sản phẩm
    accountInfo: {
      type: accountInfoSchema,
      default: null,
    },
    vpsInfo: {
      type: vpsInfoSchema,
      default: null,
    },
    // Tags để tìm kiếm nhanh
    tags: [{ type: String, trim: true }],
  },
  {
    timestamps: true,
  }
);

// Index để tìm kiếm text search nhanh
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ type: 1, isActive: 1, price: 1 });

module.exports = mongoose.model('Product', productSchema);
