// routes/bauCuaRoutes.js - Routes Bầu Cua cho User
const express = require('express');
const router = express.Router();
const { getRooms, getRoomState, placeBet, getRoomHistory } = require('../controllers/bauCuaController');
const authMiddleware = require('../middlewares/authMiddleware');
const { mongoIdParam } = require('../middlewares/validate');

// Lấy danh sách phòng (public)
router.get('/rooms', getRooms);

// Lấy trạng thái ván hiện tại (public)
router.get('/rooms/:roomId/state', mongoIdParam('roomId'), getRoomState);

// Lấy lịch sử phòng (public)
router.get('/rooms/:roomId/history', mongoIdParam('roomId'), getRoomHistory);

// Đặt cược (yêu cầu đăng nhập)
router.post('/rooms/:roomId/bet', authMiddleware, mongoIdParam('roomId'), placeBet);

module.exports = router;
