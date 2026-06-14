const express = require('express');
const router = express.Router();
const SystemSetting = require('../models/SystemSetting');

// GET /api/settings/public - Lấy các cấu hình công khai
router.get('/public', async (req, res, next) => {
  try {
    const publicKeys = [
      'trivia_enabled', 'deposit_enabled', 'wheel_enabled', 'baucua_enabled',
      'shop_name', 'shop_logo', 'boosting_enabled', 'games_enabled'
    ];
    const settings = await SystemSetting.find({ key: { $in: publicKeys } }).lean();
    const settingsObj = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    
    // Mặc định
    if (settingsObj.trivia_enabled === undefined) settingsObj.trivia_enabled = true;
    if (settingsObj.deposit_enabled === undefined) settingsObj.deposit_enabled = true;
    if (settingsObj.wheel_enabled === undefined) settingsObj.wheel_enabled = true;
    if (settingsObj.baucua_enabled === undefined) settingsObj.baucua_enabled = true;
    if (settingsObj.boosting_enabled === undefined) settingsObj.boosting_enabled = true;
    if (settingsObj.games_enabled === undefined) settingsObj.games_enabled = true;
    if (settingsObj.shop_name === undefined) settingsObj.shop_name = 'DuongKa Shop';
    if (settingsObj.shop_logo === undefined) settingsObj.shop_logo = ''; // Trống để lấy logo mặc định từ frontend
    
    res.json({ success: true, data: settingsObj });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
