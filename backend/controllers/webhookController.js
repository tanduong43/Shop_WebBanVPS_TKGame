// controllers/webhookController.js - Xử lý tín hiệu nạp tiền tự động từ ngân hàng
const Deposit = require('../models/Deposit');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { DEPOSIT_STATUS, TRANSACTION_TYPES } = require('../config/constants');
const { emitToUser } = require('../config/socket');
const PayOS = require('@payos/node');
const { sendAdminDepositEmail } = require('../utils/sendEmail');

// Khởi tạo PayOS để xác thực chữ ký webhook
let payos = null;
if (process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY) {
  try {
    payos = new PayOS(
      process.env.PAYOS_CLIENT_ID,
      process.env.PAYOS_API_KEY,
      process.env.PAYOS_CHECKSUM_KEY
    );
  } catch (error) {
    console.error('❌ Failed to initialize PayOS in Webhook:', error.message);
  }
}

/**
 * Helper xử lý cộng tiền và tạo giao dịch khi chuyển khoản khớp lệnh thành công
 */
const processSuccessfulDeposit = async (deposit, amountPaid, bankTxId = '') => {
  // Tránh xử lý trùng lặp (Idempotent check)
  if (deposit.status === DEPOSIT_STATUS.COMPLETED) {
    return { success: true, alreadyCompleted: true, deposit };
  }

  // Cập nhật trạng thái đơn nạp
  deposit.status = DEPOSIT_STATUS.COMPLETED;
  deposit.confirmedAt = new Date();
  deposit.note = `Nạp tiền tự động thành công qua Banking. Mã GD NH: ${bankTxId}`;
  await deposit.save();

  // Lấy thông tin user hiện tại để tính toán số dư trước/sau
  const user = await User.findById(deposit.userId);
  if (!user) {
    throw new Error('Không tìm thấy người dùng khớp với đơn nạp tiền');
  }

  const balanceBefore = user.balance || 0;
  const balanceAfter = balanceBefore + deposit.amount;

  // Cộng tiền vào tài khoản user
  user.balance = balanceAfter;
  await user.save();

  // Tạo nhật ký biến động số dư (Transaction)
  const transaction = new Transaction({
    userId: user._id,
    type: TRANSACTION_TYPES.DEPOSIT,
    amount: deposit.amount,
    balanceBefore,
    balanceAfter,
    description: `Nạp tiền tự động qua Banking (Mã đơn: ${deposit.orderCode})`,
    referenceId: deposit._id,
    referenceModel: 'Deposit',
  });
  await transaction.save();

  // Phát tín hiệu Realtime qua Socket.IO tới User đang online
  emitToUser(user._id, 'deposit:completed', {
    success: true,
    amount: deposit.amount,
    balance: balanceAfter,
    orderCode: deposit.orderCode,
    message: `Nạp tiền thành công! +${deposit.amount.toLocaleString('vi-VN')} VNĐ vào tài khoản.`,
  });

  emitToUser(user._id, 'balance:updated', {
    balance: balanceAfter,
  });

  console.log(`💰 [Nạp Tiền Thành Công] User: ${user.username} | Số tiền: +${deposit.amount.toLocaleString()} VNĐ. Số dư hiện tại: ${balanceAfter.toLocaleString()} VNĐ`);

  // Gửi email thông báo cho admin (chạy nền, không block process)
  sendAdminDepositEmail(deposit, user, deposit.amount).catch(err => {
    console.error('Lỗi khi gửi email admin:', err);
  });

  return { success: true, alreadyCompleted: false, deposit };
};

/**
 * POST /api/webhook/payos
 * Nhận Webhook tự động từ PayOS
 */
const handlePayOSWebhook = async (req, res, next) => {
  try {
    const webhookData = req.body;
    console.log('📬 Nhận Webhook từ PayOS:', JSON.stringify(webhookData));

    // 1. Xác thực chữ ký số của PayOS để đảm bảo an toàn tuyệt đối
    if (payos) {
      try {
        const verifiedData = payos.verifyPaymentWebhookData(webhookData);

        // Trích xuất thông tin
        const { orderCode, amount, reference } = verifiedData;

        // Tìm đơn nạp tương ứng
        const deposit = await Deposit.findOne({ orderCode, status: DEPOSIT_STATUS.PENDING });
        if (!deposit) {
          console.log(`⚠️ Không tìm thấy đơn nạp pending với mã orderCode: ${orderCode}`);
          return res.status(200).json({ error: 0, message: 'Ok but deposit not found or already completed' });
        }

        // Xử lý cộng tiền tự động
        await processSuccessfulDeposit(deposit, amount, reference);

        return res.status(200).json({
          error: 0,
          message: 'Ok',
          data: verifiedData
        });
      } catch (verifyError) {
        console.error('❌ Xác minh chữ ký PayOS thất bại:', verifyError.message);
        return res.status(400).json({ error: 1, message: 'Invalid signature' });
      }
    }

    // Nếu không cấu hình SDK PayOS, ta parse thô để thử nghiệm (Sandbox mode)
    if (webhookData && webhookData.data) {
      const { orderCode, amount, reference } = webhookData.data;
      const deposit = await Deposit.findOne({ orderCode, status: DEPOSIT_STATUS.PENDING });
      if (deposit) {
        await processSuccessfulDeposit(deposit, amount, reference || 'SANDBOX_TX');
        return res.status(200).json({ error: 0, message: 'Ok (Sandbox)' });
      }
    }

    return res.status(400).json({ error: 1, message: 'No signature config or invalid data' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/webhook/sepay
 * Nhận Webhook tự động từ SePay (Cực kỳ phổ biến để quét STK cá nhân Việt Nam)
 */
const handleSePayWebhook = async (req, res, next) => {
  try {
    const sepayData = req.body;
    console.log('📬 Nhận Webhook từ SePay:', JSON.stringify(sepayData));

    // SePay gửi nội dung chuyển khoản trong trường 'code' hoặc 'content'
    const transferContent = sepayData.content || sepayData.code || '';
    const amount = parseFloat(sepayData.transferAmount || sepayData.amount || 0);
    const bankTxId = sepayData.transactionDate || sepayData.id || 'SEPAY_TX';

    if (!transferContent) {
      return res.status(200).json({ success: false, message: 'No transfer content' });
    }

    // Trích xuất mã giao dịch số từ nội dung chuyển khoản (Ví dụ: "WSAC 102938" -> mã 102938)
    const match = transferContent.match(/WSAC\s*(\d+)/i);
    if (!match) {
      console.log(`⚠️ Nội dung chuyển khoản không chứa tiền tố WSAC: "${transferContent}"`);
      return res.status(200).json({ success: false, message: 'Content prefix not matched' });
    }

    const orderCode = parseInt(match[1]);

    // Tìm đơn nạp pending trùng khớp mã
    const deposit = await Deposit.findOne({ orderCode, status: DEPOSIT_STATUS.PENDING });
    if (!deposit) {
      console.log(`⚠️ Không tìm thấy đơn nạp pending khớp mã SePay: WSAC ${orderCode}`);
      return res.status(200).json({ success: false, message: 'Deposit not found' });
    }

    // Xử lý nạp tiền
    await processSuccessfulDeposit(deposit, amount, bankTxId);

    return res.status(200).json({
      success: true,
      message: 'Xử lý thành công'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handlePayOSWebhook,
  handleSePayWebhook,
  processSuccessfulDeposit, // Export cho admin simulator dùng
};
