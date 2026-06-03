// models/BauCuaRound.js - Schema ván chơi Bầu Cua
const mongoose = require('mongoose');
const { BAUCUA_STATUS, BAUCUA_MODE, BAUCUA_SYMBOLS } = require('../config/constants');

// Sub-schema từng lệnh cược trong ván
const betEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  username: { type: String, required: true },
  symbol: { type: String, enum: BAUCUA_SYMBOLS, required: true },
  amount: { type: Number, required: true },
  isBot: { type: Boolean, default: false },
  payout: { type: Number, default: 0 },   // Tiền nhận về (gốc + lời)
  profit: { type: Number, default: 0 },   // Lãi/lỗ thuần
}, { _id: false });

const bauCuaRoundSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BauCuaRoom',
      required: true,
    },
    roundNumber: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(BAUCUA_STATUS),
      default: BAUCUA_STATUS.WAITING,
    },
    bets: [betEntrySchema],

    // Kết quả 3 xúc xắc (sau khi xóc)
    result: {
      type: [String],
      enum: BAUCUA_SYMBOLS,
      default: [],
    },

    // Cửa hậu Admin: Admin ghi đè kết quả trong pha rolling
    adminOverride: {
      type: [String],
      enum: BAUCUA_SYMBOLS,
      default: [],
    },

    // Chế độ thuật toán đã dùng
    gameMode: {
      type: String,
      enum: Object.values(BAUCUA_MODE),
      default: null,
    },

    // Cấu hình chế độ ép buộc từ Admin
    adminModeOverride: {
      type: String,
      enum: [null, 'pure_random', 'save_user', 'sweep_216'],
      default: null,
    },

    // Thống kê tài chính của ván (chỉ tính user thật)
    totalRealBets: { type: Number, default: 0 },
    totalPayout: { type: Number, default: 0 },
    houseProfit: { type: Number, default: 0 },

    waitingEndsAt: Date,
    rollingEndsAt: Date,
    finishedAt: Date,
  },
  { timestamps: true }
);

bauCuaRoundSchema.index({ roomId: 1, roundNumber: -1 });
bauCuaRoundSchema.index({ roomId: 1, status: 1 });

module.exports = mongoose.model('BauCuaRound', bauCuaRoundSchema);
