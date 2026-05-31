// config/socket.js - Quản lý kết nối Socket.IO
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io = null;
const userSockets = new Map(); // Lưu trữ map userId -> Set(socket.id)

const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  // Middleware xác thực socket bằng JWT token
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id username role');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🔌 Client connected: ${socket.user.username} (${socket.id})`);

    // Lưu socket id vào map của user
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    // Join room cá nhân của user
    socket.join(`user:${userId}`);

    // Nếu là admin, join room admin
    if (socket.user.role === 'admin') {
      socket.join('admin:room');
      console.log(`👑 Admin connected: ${socket.user.username}`);
    }

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.user.username} (${socket.id})`);
      if (userSockets.has(userId)) {
        userSockets.get(userId).delete(socket.id);
        if (userSockets.get(userId).size === 0) {
          userSockets.delete(userId);
        }
      }
    });
  });

  return io; // Return io instance để server.js pass vào game engine
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
};

// Gửi event tới một user cụ thể (tất cả các thiết bị họ đang đăng nhập)
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId.toString()}`).emit(event, data);
  }
};

// Gửi event tới tất cả các Admin
const emitToAdmins = (event, data) => {
  if (io) {
    io.to('admin:room').emit(event, data);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToAdmins,
};
