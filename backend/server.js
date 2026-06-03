// server.js - Entry point của backend
require('dotenv').config();
const express = require('express');
const http = require('http'); // Thêm http module
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');
const { initSocket } = require('./config/socket'); // Thêm initSocket

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const depositRoutes = require('./routes/depositRoutes'); // Thêm routes nạp tiền
const webhookRoutes = require('./routes/webhookRoutes'); // Thêm routes webhook
const wheelRoutes = require('./routes/wheelRoutes'); // Thêm routes vòng quay user
const adminWheelRoutes = require('./routes/adminWheelRoutes'); // Thêm routes vòng quay admin
const bauCuaRoutes = require('./routes/bauCuaRoutes'); // Bầu Cua user routes
const adminBauCuaRoutes = require('./routes/adminBauCuaRoutes'); // Bầu Cua admin routes
const questionRoutes = require('./routes/questionRoutes'); // Trivia questions & topics
const { initGameEngine } = require('./controllers/bauCuaGameEngine'); // Bầu Cua engine
const { initTriviaEngine } = require('./controllers/triviaGameEngine'); // Trivia engine

const app = express();
const server = http.createServer(app); // Tạo HTTP Server
const PORT = process.env.PORT || 5000;

// ─── Khởi tạo Socket.IO ────────────────────────────────────────────
const io = initSocket(server);

// Khởi động Game Engine Bầu Cua sau khi DB kết nối xong
connectDB().then(() => {
  initGameEngine(io);
  initTriviaEngine(io);
});

// ─── Security Middlewares ─────────────────────────────────────────────────

// Helmet: bảo mật các HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS: cho phép frontend kết nối (hỗ trợ nhiều origin, phân cách bởi dấu phẩy)
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(url => url.trim());

app.use(cors({
  origin: function (origin, callback) {
    // Cho phép requests không có origin (mobile apps, curl, v.v.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS not allowed'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate Limiting: chống brute-force và spam
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 300,                  // Tối đa 300 requests mỗi IP
  message: { success: false, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && decoded.role === 'admin') {
          return true; // Không giới hạn request đối với tài khoản admin
        }
      }
    } catch (e) {
      // Bỏ qua lỗi giải mã token
    }
    return false;
  },
});

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 phút
  max: 20,                   // Tối đa 20 lần thử đăng nhập
  message: { success: false, message: 'Quá nhiều lần thử đăng nhập, vui lòng thử lại sau 15 phút.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: async (req) => {
    try {
      // 1. Kiểm tra JWT token (nếu đã đăng nhập và gửi request)
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && decoded.role === 'admin') {
          return true;
        }
      }

      // 2. Kiểm tra tài khoản đăng nhập xem có phải admin không
      const identifier = String(req.body?.email || req.body?.username || '').trim();
      if (identifier) {
        const User = require('./models/User');
        const user = await User.findOne({
          $or: [
            { email: identifier.toLowerCase() },
            { username: identifier },
          ],
        }).select('role');
        if (user && user.role === 'admin') {
          return true; // Không giới hạn đăng nhập đối với tài khoản admin
        }
      }
    } catch (e) {
      // Bỏ qua lỗi truy vấn DB hoặc giải mã token
    }
    return false;
  },
});

app.use(generalLimiter);

// ─── Request Middlewares ──────────────────────────────────────────────────

// Morgan: log HTTP requests
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Parse JSON body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API đang hoạt động bình thường',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Webhook routes (nên đặt trước general rate limit gắt gao hoặc để không cần auth)
app.use('/api/webhook', webhookRoutes);

// Auth routes (với rate limiter riêng)
app.use('/api/auth', authLimiter, authRoutes);

// Product routes
app.use('/api/products', productRoutes);

// Order routes
app.use('/api/orders', orderRoutes);

// Deposit routes
app.use('/api/deposits', depositRoutes);

// Spin wheel routes
app.use('/api/spin-wheels', wheelRoutes);

// Admin spin wheel routes
app.use('/api/admin-wheels', adminWheelRoutes);

// Bầu Cua user routes
app.use('/api/baucua', bauCuaRoutes);

// Bầu Cua admin routes
app.use('/api/admin/baucua', adminBauCuaRoutes);

// Trivia questions & topics
app.use('/api/questions', questionRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} không tồn tại` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = server;
