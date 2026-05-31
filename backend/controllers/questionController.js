// controllers/questionController.js - Quản lý câu hỏi & đề tài Trivia
const multer = require('multer');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const { PAGINATION } = require('../config/constants');

// Multer: nhận file JSON trong memory (không lưu disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file JSON'), false);
    }
  },
});

const uploadJsonMiddleware = upload.single('file');

/**
 * Validate một object câu hỏi từ JSON import
 */
const validateQuestionPayload = (item, index) => {
  const errors = [];
  const prefix = `Câu hỏi #${index + 1}`;

  if (!item.topicId || typeof item.topicId !== 'string') {
    errors.push(`${prefix}: topicId là bắt buộc (MongoDB ObjectId)`);
  }
  if (!item.question || typeof item.question !== 'string' || !item.question.trim()) {
    errors.push(`${prefix}: question là bắt buộc`);
  }
  if (!Array.isArray(item.options) || item.options.length !== 4) {
    errors.push(`${prefix}: options phải là mảng 4 phần tử`);
  }
  if (typeof item.correctIndex !== 'number' || item.correctIndex < 0 || item.correctIndex > 3) {
    errors.push(`${prefix}: correctIndex phải là số từ 0 đến 3`);
  }

  return errors;
};

// ─── Topics ─────────────────────────────────────────────────────────────────

const getTopics = async (req, res, next) => {
  try {
    const topics = await Topic.find({ isActive: true })
      .select('name description slug')
      .sort({ name: 1 });
    return successResponse(res, topics, 'Lấy danh sách đề tài thành công');
  } catch (error) {
    next(error);
  }
};

const getTopicsAdmin = async (req, res, next) => {
  try {
    const topics = await Topic.find().sort({ createdAt: -1 });
    return successResponse(res, topics, 'Lấy danh sách đề tài (admin) thành công');
  } catch (error) {
    next(error);
  }
};

const createTopic = async (req, res, next) => {
  try {
    const { name, description, slug } = req.body;
    if (!name?.trim()) {
      return errorResponse(res, 'Tên đề tài là bắt buộc', 422);
    }
    const topic = await Topic.create({ name: name.trim(), description, slug });
    return successResponse(res, topic, 'Tạo đề tài thành công', 201);
  } catch (error) {
    next(error);
  }
};

// ─── Questions ──────────────────────────────────────────────────────────────

const getQuestions = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(
      PAGINATION.MAX_LIMIT,
      parseInt(req.query.limit, 10) || PAGINATION.DEFAULT_LIMIT
    );
    const filter = {};
    if (req.query.topicId) filter.topicId = req.query.topicId;

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .populate('topicId', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Question.countDocuments(filter),
    ]);

    return paginatedResponse(res, questions, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

const createQuestion = async (req, res, next) => {
  try {
    const { topicId, question, options, correctIndex, difficulty } = req.body;

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return errorResponse(res, 'Đề tài không tồn tại', 404);
    }

    const errors = validateQuestionPayload({ topicId, question, options, correctIndex }, 0);
    if (errors.length) {
      return errorResponse(res, 'Dữ liệu không hợp lệ', 422, errors);
    }

    const created = await Question.create({
      topicId,
      question: question.trim(),
      options: options.map((o) => String(o).trim()),
      correctIndex,
      difficulty,
    });

    return successResponse(res, created, 'Thêm câu hỏi thành công', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/questions/import
 * Upload file JSON chứa mảng câu hỏi, insertMany hàng loạt
 */
const importQuestions = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'Vui lòng upload file JSON (field: file)', 400);
    }

    let parsed;
    try {
      parsed = JSON.parse(req.file.buffer.toString('utf8'));
    } catch {
      return errorResponse(res, 'File JSON sai định dạng — không thể parse', 400);
    }

    if (!Array.isArray(parsed)) {
      return errorResponse(res, 'File JSON phải chứa một mảng các câu hỏi', 400);
    }

    if (parsed.length === 0) {
      return errorResponse(res, 'Mảng câu hỏi không được rỗng', 400);
    }

    if (parsed.length > 1000) {
      return errorResponse(res, 'Tối đa 1000 câu hỏi mỗi lần import', 400);
    }

    const validationErrors = [];
    parsed.forEach((item, i) => {
      validationErrors.push(...validateQuestionPayload(item, i));
    });
    if (validationErrors.length) {
      return errorResponse(res, 'Dữ liệu import không hợp lệ', 422, validationErrors);
    }

    const topicIds = [...new Set(parsed.map((q) => q.topicId))];
    const existingTopics = await Topic.find({ _id: { $in: topicIds } }).select('_id');
    const existingSet = new Set(existingTopics.map((t) => t._id.toString()));
    const missingTopics = topicIds.filter((id) => !existingSet.has(id));
    if (missingTopics.length) {
      return errorResponse(
        res,
        `Các topicId không tồn tại: ${missingTopics.join(', ')}`,
        404
      );
    }

    const docs = parsed.map((item) => ({
      topicId: item.topicId,
      question: item.question.trim(),
      options: item.options.map((o) => String(o).trim()),
      correctIndex: item.correctIndex,
      difficulty: item.difficulty || 'A1',
      isActive: item.isActive !== false,
    }));

    const inserted = await Question.insertMany(docs, { ordered: false });

    return successResponse(
      res,
      { imported: inserted.length, questions: inserted },
      `Import thành công ${inserted.length} câu hỏi`,
      201
    );
  } catch (error) {
    if (error.name === 'BulkWriteError' || error.writeErrors) {
      return errorResponse(res, 'Một số câu hỏi không thể import', 422, {
        inserted: error.insertedDocs?.length || 0,
        errors: error.writeErrors?.map((e) => e.errmsg) || [error.message],
      });
    }
    next(error);
  }
};

const deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) {
      return errorResponse(res, 'Câu hỏi không tồn tại', 404);
    }
    return successResponse(res, null, 'Xóa câu hỏi thành công');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadJsonMiddleware,
  getTopics,
  getTopicsAdmin,
  createTopic,
  getQuestions,
  createQuestion,
  importQuestions,
  deleteQuestion,
};
