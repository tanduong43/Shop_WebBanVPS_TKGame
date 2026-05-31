// models/Transaction.js - Schema biến động số dư
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['deposit', 'purchase', 'refund', 'admin_adjust', 'baucua_win', 'baucua_bet'],
      required: true,
    },
    amount: {
      type: Number,
      required: true, // Số tiền biến động (+/-)
    },
    balanceBefore: {
      type: Number,
      default: 0,
    },
    balanceAfter: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      // Có thể tham chiếu tới Deposit hoặc Order
    },
    referenceModel: {
      type: String,
      enum: ['Deposit', 'Order'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Transaction', transactionSchema);
