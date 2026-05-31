// models/BauCuaRoom.js - Schema phòng chơi Bầu Cua
const mongoose = require('mongoose');

const bauCuaRoomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên phòng là bắt buộc'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    minBet: {
      type: Number,
      required: true,
      default: 1000,
      min: [1000, 'Cược tối thiểu là 1,000đ'],
    },
    maxBet: {
      type: Number,
      required: true,
      default: 500000,
      max: [500000, 'Cược tối đa là 500,000đ'],
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Thống kê phòng
    totalRounds: { type: Number, default: 0 },
    totalVolume: { type: Number, default: 0 }, // Tổng tiền cược qua đây
  },
  { timestamps: true }
);

module.exports = mongoose.model('BauCuaRoom', bauCuaRoomSchema);
