// routes/questionRoutes.js - API câu hỏi Trivia (Admin + Public topics)
const express = require('express');
const router = express.Router();
const {
  uploadJsonMiddleware,
  getTopics,
  getTopicsAdmin,
  createTopic,
  deleteTopic,
  getQuestions,
  createQuestion,
  importQuestions,
  deleteQuestion,
} = require('../controllers/questionController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/roleMiddleware');
const { mongoIdParam } = require('../middlewares/validate');

// Public: lấy danh sách đề tài cho tạo phòng
router.get('/topics', getTopics);

// Admin routes
router.get('/topics/admin', authMiddleware, requireAdmin, getTopicsAdmin);
router.post('/topics', authMiddleware, requireAdmin, createTopic);
router.delete('/topics/:id', authMiddleware, requireAdmin, mongoIdParam('id'), deleteTopic);
router.get('/', authMiddleware, requireAdmin, getQuestions);
router.post('/', authMiddleware, requireAdmin, createQuestion);
router.post('/import', authMiddleware, requireAdmin, uploadJsonMiddleware, importQuestions);
router.delete('/:id', authMiddleware, requireAdmin, mongoIdParam('id'), deleteQuestion);

module.exports = router;
