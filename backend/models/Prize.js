// models/Prize.js - Model Phần thưởng trong vòng quay
const mongoose = require('mongoose');

const prizeSchema = new mongoose.Schema(
  {
    wheelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SpinWheel',
      required: [true, 'Phần thưởng phải thuộc về một vòng quay cụ thể'],
    },
    name: {
      type: String,
      required: [true, 'Tên phần thưởng là bắt buộc'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      default: '', // Có thể lưu ảnh minh họa phần thưởng
    },
    winRate: {
      type: Number,
      required: [true, 'Tỷ lệ trúng thưởng (%) là bắt buộc'],
      min: [0, 'Tỷ lệ trúng thưởng không được nhỏ hơn 0'],
      max: [100, 'Tỷ lệ trúng thưởng không được vượt quá 100%'],
    },
    stock: {
      type: Number,
      required: [true, 'Số lượng tồn kho là bắt buộc (-1 nếu không giới hạn)'],
      default: -1, // -1: vô hạn, 0: hết hàng, > 0: số lượng còn lại
    },
    color: {
      type: String,
      default: '#3b82f6', // Màu hiển thị phân chia trên vòng quay (mặc định xanh dương)
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isJackpot: {
      type: Boolean,
      default: false, // Đánh dấu là quà đặc biệt (Jackpot) để bắn socket realtime thông báo
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Prize', prizeSchema);
