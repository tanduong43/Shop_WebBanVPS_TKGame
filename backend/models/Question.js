// models/Question.js - Câu hỏi trắc nghiệm Đố Vui Sinh Tồn
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: [true, 'Câu hỏi phải thuộc một đề tài'],
      index: true,
    },
    question: {
      type: String,
      required: [true, 'Nội dung câu hỏi là bắt buộc'],
      trim: true,
      maxlength: [1000, 'Câu hỏi không quá 1000 ký tự'],
    },
    options: {
      type: [String],
      required: [true, 'Danh sách đáp án là bắt buộc'],
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 4,
        message: 'Mỗi câu hỏi phải có đúng 4 đáp án',
      },
    },
    correctIndex: {
      type: Number,
      required: [true, 'Chỉ số đáp án đúng là bắt buộc'],
      min: [0, 'correctIndex phải từ 0 đến 3'],
      max: [3, 'correctIndex phải từ 0 đến 3'],
    },
    difficulty: {
      type: String,
      enum: ['A1', 'A2', 'B1', 'medium', 'hard'],
      default: 'A1',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

questionSchema.index({ topicId: 1, isActive: 1 });

module.exports = mongoose.model('Question', questionSchema);
