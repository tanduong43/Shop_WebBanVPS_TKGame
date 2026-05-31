// seed/seedTrivia.js - Seed đề tài & câu hỏi mẫu cho Đố Vui Sinh Tồn
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Topic = require('../models/Topic');
const Question = require('../models/Question');

const seedData = async () => {
  await connectDB();

  // Xóa dữ liệu cũ (chỉ trivia)
  await Question.deleteMany({});
  await Topic.deleteMany({});

  const topics = await Topic.insertMany([
    {
      name: 'Từ vựng tiếng Anh - Đồ gia dụng (A1-B1)',
      slug: 'english-household-a1-b1',
      description: 'Từ vựng tiếng Anh về đồ dùng trong gia đình, mức A1 đến B1',
    },
    {
      name: 'Kiến thức Thú y - Bò sữa',
      slug: 'veterinary-dairy-cattle',
      description: 'Sinh lý sinh sản và đặc điểm các giống bò sữa',
    },
  ]);

  const [englishTopic, vetTopic] = topics;

  const questions = [
    // ── Tiếng Anh - Đồ gia dụng ──
    {
      topicId: englishTopic._id,
      question: 'What is the English word for "cái bàn"?',
      options: ['Chair', 'Table', 'Bed', 'Shelf'],
      correctIndex: 1,
      difficulty: 'A1',
    },
    {
      topicId: englishTopic._id,
      question: 'Which item do you use to cut food in the kitchen?',
      options: ['Spoon', 'Fork', 'Knife', 'Plate'],
      correctIndex: 2,
      difficulty: 'A1',
    },
    {
      topicId: englishTopic._id,
      question: 'What do you call the machine that washes your clothes?',
      options: ['Dryer', 'Washing machine', 'Refrigerator', 'Microwave'],
      correctIndex: 1,
      difficulty: 'A2',
    },
    {
      topicId: englishTopic._id,
      question: 'Which room in a house usually has a sofa and a TV?',
      options: ['Bathroom', 'Kitchen', 'Living room', 'Garage'],
      correctIndex: 2,
      difficulty: 'A2',
    },
    {
      topicId: englishTopic._id,
      question: 'What is a "blender" used for?',
      options: [
        'To iron clothes',
        'To mix or puree food and drinks',
        'To vacuum the floor',
        'To store frozen food',
      ],
      correctIndex: 1,
      difficulty: 'B1',
    },
    // ── Thú y - Bò sữa ──
    {
      topicId: vetTopic._id,
      question: 'Thời gian mang thai trung bình của bò sữa là bao nhiêu ngày?',
      options: ['180 ngày', '240 ngày', '283 ngày', '320 ngày'],
      correctIndex: 2,
      difficulty: 'medium',
    },
    {
      topicId: vetTopic._id,
      question: 'Giống bò sữa nào nổi tiếng với năng suất sữa cao nhất thế giới?',
      options: ['Angus', 'Holstein Friesian', 'Brahman', 'Hereford'],
      correctIndex: 1,
      difficulty: 'medium',
    },
    {
      topicId: vetTopic._id,
      question: 'Tuyến sữa của bò được hình thành chủ yếu ở vùng nào?',
      options: ['Thân trước', 'Bụng', 'Đùi sau', 'Cổ'],
      correctIndex: 1,
      difficulty: 'medium',
    },
    {
      topicId: vetTopic._id,
      question: 'Chu kỳ động dục của bò sữa trưởng thành trung bình kéo dài bao lâu?',
      options: ['7 ngày', '14 ngày', '21 ngày', '45 ngày'],
      correctIndex: 2,
      difficulty: 'medium',
    },
    {
      topicId: vetTopic._id,
      question: 'Đặc điểm nào phân biệt bò sữa Jersey với Holstein?',
      options: [
        'Jersey có màu đen trắng loang lổ',
        'Jersey nhỏ hơn, màu nâu vàng, sữa giàu bé',
        'Jersey không có sừng',
        'Jersey chỉ sinh con một lần',
      ],
      correctIndex: 1,
      difficulty: 'medium',
    },
  ];

  await Question.insertMany(questions);

  console.log(`✅ Seed Trivia: ${topics.length} đề tài, ${questions.length} câu hỏi`);
  await mongoose.connection.close();
  process.exit(0);
};

seedData().catch((err) => {
  console.error('❌ Seed Trivia thất bại:', err);
  process.exit(1);
});
