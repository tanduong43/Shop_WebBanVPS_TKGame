// models/RegistrationLog.js - Lưu lịch sử đăng ký theo IP (bền vững)
const mongoose = require('mongoose');

const registrationLogSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    index: true,
  },
  // Ngày theo dạng 'YYYY-MM-DD' để dễ query và reset hàng ngày
  date: {
    type: String,
    required: true,
  },
  // Mảng timestamp (ms) của các lần đăng ký trong ngày
  timestamps: {
    type: [Number],
    default: [],
  },
}, {
  timestamps: true,
});

// Index kết hợp để query nhanh
registrationLogSchema.index({ ip: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('RegistrationLog', registrationLogSchema);
