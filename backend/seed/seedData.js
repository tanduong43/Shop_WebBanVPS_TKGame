// seed/seedData.js - Script khởi tạo dữ liệu mẫu
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

const seedUsers = [
  {
    username: 'nguyenduong',
    email: 'nguyenduong432005@gmail.com',
    password: 'Duong@43',
    role: 'admin',
  },
  {
    username: 'test1234',
    email: 'testuser@example.com',
    password: 'Duong@43',
    role: 'user',
  },
  {
    username: 'test123',
    email: 'gamerpro@example.com',
    password: 'Duong@43',
    role: 'user',
  },
  {
    username: 'kimloan',
    email: 'tanduong03211@gmail.com',
    password: 'Duong@43',
    role: 'user',
  },
];

const seedProducts = [
  // ───  Tài khoản game ──────────────────────────────────────────────────────
  {
    type: 'game_account',
    name: 'Tài Khoản Liên Quân Mobile VIP – Rank Thách Đấu',
    price: 850000,
    description: 'Account Liên Quân rank Thách Đấu, có nhiều tướng và skin hiếm. Đã xác minh OTP. An toàn 100%.',
    stock: 1,
    tags: ['lien quan', 'rank cao', 'thach dau', 'mobile'],
    accountInfo: {
      server: 'VN Server',
      level: 30,
      characters: 'Zill, Tulen, Alice, Florentino, Hayate',
      items: '15 skin Legendary, 3 skin Limited Edition',
      loginMethod: 'Email',
      extras: 'Có OTP, full tướng 78/80, 50.000 xu',
    }
  },

  // ─── VPS ─────────────────────────────────────────────────────────────────
  {
    type: 'vps',
    name: 'VPS Nat CPU:1 Core Ram:512MB Disk SSD 15G',
    price: 30000,
    description: 'VPS Nat CPU:1 Core Ram:512MB Disk SSD 15G Hệ Điều hành: Windown Băng thông: không giới hạn Giá:30k/tháng',
    stock: 50,
    tags: ['vps', 'nat', 'windown'],
    vpsInfo: {
      ram: '512MB',
      cpu: '1 Core',
      storage: '15G SSD',
      bandwidth: 'Không giới hạn',
      os: 'Windown',
      location: 'Việt Nam',
      uptime: '99.9%',
    },
  },
  
  {
    type: 'vps',
    name: 'VPS CPU:2 Ram:8G (Tuần)',
    price: 30000,
    description: 'VPS CPU:2 Ram:8G Giá:30k/tuần',
    stock: 50,
    tags: ['vps', 'tuần'],
    vpsInfo: {
      ram: '8G',
      cpu: '2 Core',
      storage: 'Không xác định',
      bandwidth: 'Không xác định',
      os: 'Không xác định',
      location: 'Việt Nam',
      uptime: '99.9%',
    },
  },
];

const runSeed = async () => {
  try {
    console.log('🌱 Bắt đầu seed dữ liệu...\n');
    await connectDB();

    // Xóa dữ liệu cũ
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
    ]);
    console.log('🗑️  Đã xóa dữ liệu cũ\n');

    // Seed users (password sẽ được hash bởi pre-save hook trong User model)
    const createdUsers = await User.insertMany(
      await Promise.all(
        seedUsers.map(async (u) => ({
          ...u,
          password: await bcrypt.hash(u.password, 12),
        }))
      )
    );
    console.log(`✅ Đã tạo ${createdUsers.length} users:`);
    createdUsers.forEach((u) => console.log(`   - ${u.role.toUpperCase()}: ${u.username} / ${u.email}`));

    // Seed products
    const createdProducts = await Product.insertMany(seedProducts);
    console.log(`\n✅ Đã tạo ${createdProducts.length} sản phẩm:`);
    createdProducts.forEach((p) => console.log(`   - [${p.type}] ${p.name} – ${p.price.toLocaleString('vi-VN')}đ`));

    // Tạo một vài đơn hàng mẫu
    const testUser = createdUsers.find((u) => u.role === 'user');
    const gameProduct = createdProducts.find((p) => p.type === 'game_account');
    const vpsProduct = createdProducts.find((p) => p.type === 'vps');

    if (testUser && gameProduct && vpsProduct) {
      await Order.insertMany([
        {
          userId: testUser._id,
          items: [{ productId: gameProduct._id, name: gameProduct.name, type: gameProduct.type, price: gameProduct.price, quantity: 1 }],
          totalPrice: gameProduct.price,
          status: 'completed',
          zaloMessage: 'Đơn hàng mẫu',
          contactInfo: { username: testUser.username, email: testUser.email },
        },
        {
          userId: testUser._id,
          items: [{ productId: vpsProduct._id, name: vpsProduct.name, type: vpsProduct.type, price: vpsProduct.price, quantity: 1 }],
          totalPrice: vpsProduct.price,
          status: 'pending_contact',
          zaloMessage: 'Đơn hàng mẫu 2',
          contactInfo: { username: testUser.username, email: testUser.email },
        },
      ]);
      console.log('\n✅ Đã tạo 2 đơn hàng mẫu');
    }

    console.log('\n🎉 Seed dữ liệu hoàn tất!');
    console.log('\n📋 Thông tin đăng nhập:');
    console.log('   Admin: nguyenduong@admin.com / Duong@43');
    console.log('   User test: testuser@example.com / Test@123');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed thất bại:', error);
    process.exit(1);
  }
};

runSeed();
