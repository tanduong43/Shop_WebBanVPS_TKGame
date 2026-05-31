// routes/adminBauCuaRoutes.js - Routes Admin quản lý phòng Bầu Cua
const express = require('express');
const router = express.Router();
const {
  getAllRooms, createRoom, updateRoom, toggleRoom, deleteRoom, getRoomHistory, getStats
} = require('../controllers/adminBauCuaController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/roleMiddleware');
const { mongoIdParam } = require('../middlewares/validate');

// Bảo vệ toàn bộ route bằng JWT + Admin
router.use(authMiddleware, requireAdmin);

router.get('/stats', getStats);
router.get('/rooms', getAllRooms);
router.post('/rooms', createRoom);
router.put('/rooms/:id', mongoIdParam('id'), updateRoom);
router.put('/rooms/:id/toggle', mongoIdParam('id'), toggleRoom);
router.delete('/rooms/:id', mongoIdParam('id'), deleteRoom);
router.get('/rooms/:id/history', mongoIdParam('id'), getRoomHistory);

module.exports = router;
