// routes/productRoutes.js - Các route sản phẩm
const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin,
} = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/roleMiddleware');
const { productValidation, mongoIdParam } = require('../middlewares/validate');

// ─── Public routes (không cần đăng nhập) ───────────────────────────────────

// GET /api/products - Lấy danh sách sản phẩm (có filter, search, pagination)
router.get('/', getProducts);

// GET /api/products/admin/all - Lấy tất cả sản phẩm cho admin (phải đứng trước /:id)
router.get('/admin/all', authMiddleware, requireAdmin, getAllProductsAdmin);

// GET /api/products/:id - Lấy chi tiết 1 sản phẩm
router.get('/:id', mongoIdParam('id'), getProduct);

// ─── Admin routes ────────────────────────────────────────────────────────────

// POST /api/products - Tạo sản phẩm mới
router.post('/', authMiddleware, requireAdmin, productValidation, createProduct);

// PUT /api/products/:id - Cập nhật sản phẩm
router.put('/:id', authMiddleware, requireAdmin, mongoIdParam('id'), updateProduct);

// DELETE /api/products/:id - Xóa mềm sản phẩm
router.delete('/:id', authMiddleware, requireAdmin, mongoIdParam('id'), deleteProduct);

module.exports = router;
