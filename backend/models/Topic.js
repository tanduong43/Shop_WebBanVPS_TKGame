// models/Topic.js - Đề tài câu hỏi Đố Vui Sinh Tồn
const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên đề tài là bắt buộc'],
      trim: true,
      maxlength: [100, 'Tên đề tài không quá 100 ký tự'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Mô tả không quá 500 ký tự'],
      default: '',
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

topicSchema.index({ isActive: 1 });

module.exports = mongoose.model('Topic', topicSchema);
