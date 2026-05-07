// controllers/productController.js - CRUD sản phẩm
const Product = require('../models/Product');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const { PAGINATION } = require('../config/constants');

/**
 * GET /api/products
 * Lấy danh sách sản phẩm với filter, search, pagination
 */
const getProducts = async (req, res, next) => {
  try {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      type,         // 'game_account' | 'vps'
      search,       // text search
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (type) filter.type = type;

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Text search (sử dụng MongoDB text index)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(parseInt(limit), PAGINATION.MAX_LIMIT);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortObj).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(filter),
    ]);

    return paginatedResponse(res, products, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/:id
 * Lấy chi tiết 1 sản phẩm
 */
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isActive: true });
    if (!product) {
      return errorResponse(res, 'Không tìm thấy sản phẩm', 404);
    }
    return successResponse(res, product);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/products  [Admin only]
 * Tạo sản phẩm mới
 */
const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    return successResponse(res, product, 'Tạo sản phẩm thành công', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/products/:id  [Admin only]
 * Cập nhật sản phẩm
 */
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      return errorResponse(res, 'Không tìm thấy sản phẩm', 404);
    }
    return successResponse(res, product, 'Cập nhật sản phẩm thành công');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/products/:id  [Admin only]
 * Xóa mềm sản phẩm (set isActive = false)
 */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!product) {
      return errorResponse(res, 'Không tìm thấy sản phẩm', 404);
    }
    return successResponse(res, null, 'Xóa sản phẩm thành công');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/admin/all  [Admin only]
 * Lấy tất cả sản phẩm kể cả đã xóa mềm
 */
const getAllProductsAdmin = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20, type, search,
    } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(parseInt(limit), 50);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(filter),
    ]);

    return paginatedResponse(res, products, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getAllProductsAdmin };
