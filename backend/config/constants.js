// config/constants.js - Các hằng số toàn cục của ứng dụng

const ORDER_STATUS = {
  PENDING_CONTACT: 'pending_contact', // Chờ liên hệ qua Zalo
  COMPLETED: 'completed',             // Đã hoàn thành
  CANCELLED: 'cancelled',             // Đã hủy
};

const PRODUCT_TYPES = {
  GAME_ACCOUNT: 'game_account', // Tài khoản game
  VPS: 'vps',                   // VPS
};

const USER_ROLES = {
  USER: 'user',   // Người dùng thường
  ADMIN: 'admin', // Quản trị viên
};

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 50,
};

module.exports = { ORDER_STATUS, PRODUCT_TYPES, USER_ROLES, PAGINATION };
