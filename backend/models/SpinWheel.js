// models/SpinWheel.js - Model Vòng quay may mắn
const mongoose = require('mongoose');

const spinWheelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên vòng quay là bắt buộc'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Giá lượt quay là bắt buộc'],
      min: [0, 'Giá lượt quay không được âm'],
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SpinWheel', spinWheelSchema);
