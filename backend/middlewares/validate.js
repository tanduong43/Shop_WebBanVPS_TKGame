// middlewares/validate.js - express-validator validation chains
const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');
const { PRODUCT_TYPES, ORDER_STATUS } = require('../config/constants');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Middleware chạy sau validation chains để kiểm tra và trả lỗi
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(
      res,
      'Dữ liệu đầu vào không hợp lệ',
      422,
      errors.array().map((e) => ({ field: e.path, message: e.msg }))
    );
  }
  next();
};

// ───────────────────────────── Auth validators ─────────────────────────────
const registerValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username là bắt buộc')
    .isLength({ min: 3, max: 30 }).withMessage('Username phải từ 3–30 ký tự')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username chỉ chứa chữ, số và gạch dưới'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email là bắt buộc')
    .isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password là bắt buộc')
    .isLength({ min: 6 }).withMessage('Password phải có ít nhất 6 ký tự'),
  handleValidationErrors,
];

const loginValidation = [
  // Cho phép đăng nhập bằng email hoặc username (frontend vẫn gửi field "email")
  body('email')
    .trim()
    .notEmpty().withMessage('Email/Username là bắt buộc')
    .isLength({ max: 100 }).withMessage('Email/Username không hợp lệ')
    .custom((value) => {
      // Nếu có ký tự "@", validate theo email; nếu không, coi như username
      if (value.includes('@')) {
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(value)) throw new Error('Email không hợp lệ');
      } else {
        const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
        if (!usernameRegex.test(value)) throw new Error('Username không hợp lệ');
      }
      return true;
    }),
  body('password').notEmpty().withMessage('Password là bắt buộc'),
  handleValidationErrors,
];

// ─────────────────────────── Product validators ────────────────────────────
const productValidation = [
  body('type')
    .notEmpty().withMessage('Loại sản phẩm là bắt buộc')
    .isIn(Object.values(PRODUCT_TYPES)).withMessage('Loại sản phẩm không hợp lệ'),
  body('name')
    .trim()
    .notEmpty().withMessage('Tên sản phẩm là bắt buộc')
    .isLength({ max: 100 }).withMessage('Tên không quá 100 ký tự'),
  body('price')
    .notEmpty().withMessage('Giá là bắt buộc')
    .isFloat({ min: 0 }).withMessage('Giá phải là số không âm'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Số lượng phải là số không âm'),
  body('description')
    .optional()
    .isLength({ max: 1000 }).withMessage('Mô tả không quá 1000 ký tự'),
  body('accountInfo.images')
    .optional()
    .isArray().withMessage('Danh sách ảnh phải là mảng'),
  body('accountInfo.images.*')
    .optional()
    .isString().withMessage('Mỗi ảnh phải là chuỗi URL'),
  handleValidationErrors,
];

// ─────────────────────────── Order validators ──────────────────────────────
const orderValidation = [
  body('items')
    .isArray({ min: 1 }).withMessage('Đơn hàng phải có ít nhất 1 sản phẩm'),
  body('items.*.productId')
    .notEmpty().withMessage('productId là bắt buộc')
    .isMongoId().withMessage('productId không hợp lệ'),
  body('items.*.quantity')
    .isInt({ min: 1 }).withMessage('Số lượng phải ít nhất là 1'),
  handleValidationErrors,
];

const updateOrderStatusValidation = [
  body('status')
    .notEmpty().withMessage('Trạng thái là bắt buộc')
    .isIn(Object.values(ORDER_STATUS)).withMessage('Trạng thái không hợp lệ'),
  handleValidationErrors,
];

// ─────────────────────────── Param validators ──────────────────────────────
const mongoIdParam = (paramName = 'id') => [
  param(paramName).isMongoId().withMessage(`${paramName} không hợp lệ`),
  handleValidationErrors,
];

module.exports = {
  registerValidation,
  loginValidation,
  productValidation,
  orderValidation,
  updateOrderStatusValidation,
  mongoIdParam,
  handleValidationErrors,
};
