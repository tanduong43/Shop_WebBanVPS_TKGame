// models/Deposit.js - Schema đơn nạp tiền
const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Số tiền nạp là bắt buộc'],
      min: [10000, 'Số tiền nạp tối thiểu là 10.000 VNĐ'],
    },
    orderCode: {
      type: Number,
      required: true,
      unique: true, // Mã đơn hàng số cho PayOS (yêu cầu dạng Number)
    },
    transferContent: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'expired'],
      default: 'pending',
    },
    checkoutUrl: {
      type: String,
    },
    qrCode: {
      type: String,
    },
    paymentLinkId: {
      type: String, // ID liên kết thanh toán từ PayOS
    },
    confirmedAt: {
      type: Date,
    },
    note: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Deposit', depositSchema);
