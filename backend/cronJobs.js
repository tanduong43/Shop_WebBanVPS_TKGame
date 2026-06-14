const cron = require('node-cron');
const Order = require('./models/Order');

/**
 * Khởi tạo các cronjob tự động cho hệ thống
 */
const initCronJobs = () => {
  // Chạy mỗi giờ một lần (hoặc có thể chỉnh thành mỗi ngày lúc 0h: '0 0 * * *')
  // Để kiểm tra nhanh có thể dùng '*/5 * * * *' (mỗi 5 phút)
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Running auto-complete boosting orders check...');
    try {
      const now = new Date();
      // Tìm các order đang processing, có chứa item loại boosting mà expiresAt <= now
      const ordersToComplete = await Order.find({
        status: 'processing',
        items: {
          $elemMatch: {
            type: 'boosting',
            'credentials.expiresAt': { $lte: now }
          }
        }
      });

      if (ordersToComplete.length > 0) {
        console.log(`[Cron] Found ${ordersToComplete.length} orders to auto-complete.`);
        
        for (const order of ordersToComplete) {
          // Đổi trạng thái order thành completed
          order.status = 'completed';
          await order.save();
          console.log(`[Cron] Auto-completed order ${order._id}`);
        }
      }
    } catch (error) {
      console.error('[Cron] Error running auto-complete boosting orders:', error);
    }
  });

  console.log('[Cron] Cron jobs initialized successfully.');
};

module.exports = { initCronJobs };
