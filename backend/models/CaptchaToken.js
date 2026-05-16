// models/CaptchaToken.js - Lưu CAPTCHA toán học có TTL
const mongoose = require('mongoose');

const captchaTokenSchema = new mongoose.Schema({
  answer: {
    type: Number,
    required: true,
  },
  // MongoDB tự xóa document sau `expireAfterSeconds` giây tính từ `expiresAt`
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 phút
    index: { expireAfterSeconds: 0 },
  },
  used: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('CaptchaToken', captchaTokenSchema);
