// seed/seedWheels.js - Script seed dữ liệu Vòng quay & Phần thưởng mẫu
require('dotenv').config({ path: '../.env' }); // Đọc .env từ thư mục gốc backend
const mongoose = require('mongoose');
const SpinWheel = require('../models/SpinWheel');
const Prize = require('../models/Prize');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/webshopac';

const seedWheelsData = async () => {
  try {
    console.log('🔄 Đang kết nối tới database để seed...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Kết nối database thành công!');

    // 1. Dọn dẹp dữ liệu cũ
    console.log('🧹 Đang dọn dẹp dữ liệu Vòng Quay & Phần Thưởng cũ...');
    await SpinWheel.deleteMany({});
    await Prize.deleteMany({});
    console.log('🧹 Đã dọn dẹp sạch sẽ!');

    // 2. Tạo Vòng quay 1: Vòng quay Sinh Viên (Giá rẻ)
    console.log('🎡 Đang tạo Vòng Quay Sinh Viên...');
    const studentWheel = new SpinWheel({
      name: 'Vòng Quay Sinh Viên',
      price: 10000,
      description: 'Vòng quay giá rẻ dành cho mọi đối tượng học sinh - sinh viên. Cơ hội trúng thẻ nạp, voucher và Jackpot cực hot!',
      isActive: true,
    });
    await studentWheel.save();

    // 3. Tạo các phần quà cho Vòng quay Sinh Viên
    console.log('🎁 Đang tạo phần thưởng cho Vòng Quay Sinh Viên...');
    const studentPrizes = [
      {
        wheelId: studentWheel._id,
        name: 'Chúc bạn may mắn lần sau',
        description: 'Tiếc quá, chúc bạn may mắn trong các lượt quay tiếp theo!',
        winRate: 35.0,
        stock: -1, // vô hạn
        color: '#4b5563', // xám
        isActive: true,
        isJackpot: false,
      },
      {
        wheelId: studentWheel._id,
        name: '+5.000 VNĐ vào ví',
        description: 'Chúc mừng bạn trúng giải khuyến khích: 5.000đ cộng trực tiếp vào ví.',
        winRate: 30.0,
        stock: -1,
        color: '#3b82f6', // xanh dương
        isActive: true,
        isJackpot: false,
      },
      {
        wheelId: studentWheel._id,
        name: '+10.000 VNĐ vào ví',
        description: 'Tuyệt vời! Bạn đã trúng giải ba, hòa vốn lượt quay!',
        winRate: 20.0,
        stock: -1,
        color: '#10b981', // xanh lá
        isActive: true,
        isJackpot: false,
      },
      {
        wheelId: studentWheel._id,
        name: 'Voucher Giảm Giá 10%',
        description: 'Mã giảm giá 10% áp dụng cho toàn bộ Game Account & VPS trên website.',
        winRate: 10.0,
        stock: 50,
        color: '#8b5cf6', // tím
        isActive: true,
        isJackpot: false,
      },
      {
        wheelId: studentWheel._id,
        name: 'VPS Gói 1 (Hạn 3 ngày)',
        description: 'Chúc mừng bạn trúng giải nhì: Trúng 1 VPS Gói 1 sử dụng miễn phí trong 3 ngày.',
        winRate: 4.5,
        stock: 10,
        color: '#f59e0b', // cam
        isActive: true,
        isJackpot: false,
      },
      {
        wheelId: studentWheel._id,
        name: 'Jackpot 100.000 VNĐ 💎',
        description: 'SIÊU JACKPOT CỰC ĐỈNH! Bạn đã trúng giải Jackpot độc đắc của Vòng Quay Học Sinh.',
        winRate: 0.5,
        stock: 3,
        color: '#ec4899', // hồng neon
        isActive: true,
        isJackpot: true,
      },
    ];
    await Prize.insertMany(studentPrizes);

    // 4. Tạo Vòng quay 2: Vòng quay Siêu Cấp VIP
    console.log('🎡 Đang tạo Vòng Quay Siêu Cấp VIP...');
    const vipWheel = new SpinWheel({
      name: 'Vòng Quay Siêu Cấp VIP',
      price: 50000,
      description: 'Vòng quay cao cấp với cơ cấu giải thưởng cực khủng: VPS Pro 1 tháng, Account Game VIP và Siêu Jackpot lên tới 500K!',
      isActive: true,
    });
    await vipWheel.save();

    // 5. Tạo các phần quà cho Vòng quay Siêu Cấp VIP
    console.log('🎁 Đang tạo phần thưởng cho Vòng Quay Siêu Cấp VIP...');
    const vipPrizes = [
      {
        wheelId: vipWheel._id,
        name: 'Chúc may mắn lần sau',
        description: 'Cố gắng lên nhé! May mắn luôn ở lượt quay kế tiếp.',
        winRate: 30.0,
        stock: -1,
        color: '#6b7280', // xám
        isActive: true,
        isJackpot: false,
      },
      {
        wheelId: vipWheel._id,
        name: '+20.000 VNĐ vào ví',
        description: 'Chúc mừng bạn trúng giải an ủi: 20.000đ cộng vào ví.',
        winRate: 35.0,
        stock: -1,
        color: '#f43f5e', // đỏ
        isActive: true,
        isJackpot: false,
      },
      {
        wheelId: vipWheel._id,
        name: '+50.000 VNĐ vào ví',
        description: 'Đỉnh cao! Bạn đã trúng giải ba, hòa vốn lượt quay siêu tốc!',
        winRate: 20.0,
        stock: -1,
        color: '#10b981', // xanh lá
        isActive: true,
        isJackpot: false,
      },
      {
        wheelId: vipWheel._id,
        name: 'VPS Pro (Hạn 1 tháng)',
        description: 'Cực khủng! Bạn đã trúng 1 VPS Pro trị giá cao, hạn dùng 1 tháng.',
        winRate: 7.0,
        stock: 5,
        color: '#06b6d4', // xanh cyan
        isActive: true,
        isJackpot: false,
      },
      {
        wheelId: vipWheel._id,
        name: 'Acc Game Random Cực VIP',
        description: 'Chúc mừng bạn trúng giải đặc biệt: 1 Account game ngẫu nhiên siêu VIP trong kho.',
        winRate: 2.0,
        stock: 3,
        color: '#d97706', // vàng đậm
        isActive: true,
        isJackpot: false,
      },
      {
        wheelId: vipWheel._id,
        name: 'Siêu Jackpot 500.000 VNĐ 👑',
        description: 'ĐỘC ĐẮC VÔ ĐỊCH! Bạn đã phá đảo Siêu Jackpot của Vòng Quay VIP. Quá xuất sắc!',
        winRate: 1.0,
        stock: 2,
        color: '#eab308', // vàng óng ánh
        isActive: true,
        isJackpot: true,
      },
    ];
    await Prize.insertMany(vipPrizes);

    console.log('\n✅ SEED DỮ LIỆU VÒNG QUAY VÀ PHẦN THƯỞNG HOÀN TẤT THÀNH CÔNG! 🎉');
    console.log(`- Đã tạo: 2 Vòng quay mẫu`);
    console.log(`- Đã tạo: 12 Phần quà mẫu chia đều tương ứng`);
  } catch (error) {
    console.error('❌ Lỗi chạy script seed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối database.');
  }
};

// Chạy seed
seedWheelsData();
