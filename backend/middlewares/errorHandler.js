// middlewares/errorHandler.js - Global error handler
const { errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * Global error handling middleware
 * Phải đặt sau tất cả routes trong server.js: app.use(errorHandler)
 */
const errorHandler = (err, req, res, next) => {
  // Ghi nhận lỗi chi tiết kèm meta
  const meta = {
    method: req.method,
    url: req.originalUrl,
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  };
  logger.error(err.stack || err.message, meta);

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return errorResponse(res, messages.join(', '), 400);
  }

  // Mongoose Duplicate Key Error (unique constraint)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return errorResponse(res, `${field} đã tồn tại trong hệ thống`, 409);
  }

  // Mongoose Cast Error (invalid ObjectId)
  if (err.name === 'CastError') {
    return errorResponse(res, 'ID không hợp lệ', 400);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Token không hợp lệ', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Token đã hết hạn', 401);
  }

  // Default: Internal Server Error
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Lỗi máy chủ nội bộ'
    : err.message || 'Lỗi máy chủ nội bộ';

  return errorResponse(res, message, statusCode);
};

module.exports = errorHandler;
