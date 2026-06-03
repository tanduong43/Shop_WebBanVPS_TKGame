// utils/auditLogger.js - Helper lưu nhật ký hoạt động (Audit Trail) của Admin
const AdminLog = require('../models/AdminLog');

/**
 * Lưu một vết hoạt động của Admin vào database
 * @param {string} adminId - MongoDB ObjectId của Admin thực hiện
 * @param {string} action - Loại hành động (ví dụ: CONFIRM_DEPOSIT, ADJUST_BALANCE)
 * @param {string} details - Mô tả chi tiết hành động
 */
const logAdminAction = async (adminId, action, details) => {
  try {
    const auditLog = new AdminLog({ adminId, action, details });
    await auditLog.save();
    return auditLog;
  } catch (err) {
    console.error('❌ Failed to write admin audit log:', err.message);
    return null;
  }
};

module.exports = { logAdminAction };
