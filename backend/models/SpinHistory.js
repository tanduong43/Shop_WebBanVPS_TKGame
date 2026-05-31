// models/SpinHistory.js - Model lưu lịch sử quay thưởng
const mongoose = require('mongoose');

const spinHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    wheelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SpinWheel',
      required: true,
    },
    prizeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prize',
      required: true,
    },
    price: {
      type: Number,
      required: true, // Lưu giá tiền tại thời điểm quay
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SpinHistory', spinHistorySchema);
