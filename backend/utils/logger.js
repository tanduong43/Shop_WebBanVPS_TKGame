// utils/logger.js - Helper ghi log hệ thống ra file tự động
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');

// Đảm bảo thư mục logs tồn tại
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

/**
 * Ghi log ra tệp tin
 * @param {string} filename - Tên file log
 * @param {string} level - Mức độ log (info, warn, error)
 * @param {string} message - Nội dung thông báo
 * @param {*} meta - Thông tin bổ sung
 */
const writeLog = (filename, level, message, meta = '') => {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` | Meta: ${JSON.stringify(meta)}` : '';
  const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`;

  fs.appendFile(path.join(logDir, filename), logLine, (err) => {
    if (err) {
      console.error('❌ Failed to write to log file:', err.message);
    }
  });
};

const logger = {
  info: (message, meta) => {
    console.log(`ℹ️ [INFO] ${message}`);
    writeLog('combined.log', 'info', message, meta);
  },
  warn: (message, meta) => {
    console.warn(`⚠️ [WARN] ${message}`);
    writeLog('combined.log', 'warn', message, meta);
  },
  error: (message, meta) => {
    console.error(`❌ [ERROR] ${message}`);
    writeLog('error.log', 'error', message, meta);
    writeLog('combined.log', 'error', message, meta);
  },
};

module.exports = logger;
