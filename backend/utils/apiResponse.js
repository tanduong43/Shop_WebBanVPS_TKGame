// utils/apiResponse.js - Helper chuẩn hóa response API
/**
 * Trả về response thành công
 * @param {Object} res - Express response object
 * @param {*} data - Dữ liệu trả về
 * @param {string} message - Thông báo
 * @param {number} statusCode - HTTP status code (mặc định 200)
 */
const successResponse = (res, data, message = 'Thành công', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Trả về response lỗi
 * @param {Object} res - Express response object
 * @param {string} message - Thông báo lỗi
 * @param {number} statusCode - HTTP status code (mặc định 400)
 * @param {*} errors - Chi tiết lỗi (validation errors, etc.)
 */
const errorResponse = (res, message = 'Có lỗi xảy ra', statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message,
  };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

/**
 * Trả về response có pagination
 */
const paginatedResponse = (res, data, pagination, message = 'Thành công') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};

module.exports = { successResponse, errorResponse, paginatedResponse };
