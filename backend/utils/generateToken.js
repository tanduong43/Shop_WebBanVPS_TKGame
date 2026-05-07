// utils/generateToken.js - Tạo JWT token
const jwt = require('jsonwebtoken');

/**
 * Tạo JWT access token
 * @param {Object} payload - Dữ liệu đưa vào token (thường là { id, role })
 * @returns {string} JWT token string
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Xác thực và decode JWT token
 * @param {string} token - JWT token string
 * @returns {Object} Decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
