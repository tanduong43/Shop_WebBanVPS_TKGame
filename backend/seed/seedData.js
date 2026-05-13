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
    username: 'test@123',
    email: 'testuser@example.com',
    password: 'Test@123',
    role: 'user',
  },
  {
    username: 'gamer_pro',
    email: 'gamerpro@example.com',
    password: 'Gamer@123',
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
  // ─── 5 Tài khoản game ──────────────────────────────────────────────────────
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
    },
  },
  {
    type: 'game_account',
    name: 'Tài Khoản PUBG Mobile – Platinum III Full CRATE',
    price: 450000,
    description: 'Tài khoản PUBG Mobile Platinum III, nhiều trang phục hiếm, bộ sưu tập đầy đủ. Không bị ban.',
    stock: 1,
    tags: ['pubg', 'battle royale', 'mobile'],
    accountInfo: {
      server: 'Asia',
      level: 60,
      characters: '1 nhân vật chính',
      items: 'Kar98k – Glacier, M416 – Glacier, nhiều set trang phục Legendary',
      loginMethod: 'Facebook',
      extras: 'Đang ở rank Platinum III, 25+ bộ trang phục Legendary',
    },
  },
  {
    type: 'game_account',
    name: 'Tài Khoản Free Fire – Rank Kim Cương Elite',
    price: 620000,
    description: 'Account Free Fire Kim Cương, nhiều skin súng và nhân vật mạnh. Bảo hành 7 ngày.',
    stock: 2,
    tags: ['free fire', 'freefire', 'rank kim cuong'],
    accountInfo: {
      server: 'VN',
      level: 70,
      characters: 'Chrono, Alok, K, Skyler, Wukong',
      items: '20+ skin Legendary, M1887 – Winterlands, AK – Dreki',
      loginMethod: 'Gmail',
      extras: 'Rank Kim Cương, 5 nhân vật kỹ năng tối đa',
    },
  },
  {
    type: 'game_account',
    name: 'Tài Khoản Genshin Impact AR 55 – Full Character',
    price: 1200000,
    description: 'Account Genshin Impact Adventure Rank 55, có đầy đủ nhân vật 5 sao hiếm. Sẵn sàng chơi end-game.',
    stock: 1,
    tags: ['genshin', 'genshin impact', 'ar55', '5 sao'],
    accountInfo: {
      server: 'Asia',
      level: 55,
      characters: 'Hu Tao, Raiden Shogun, Zhongli, Ganyu, Venti, Kazuha, Ayaka',
      items: 'Weapon 5★ đầy đủ cho nhân vật chính',
      loginMethod: 'HoYoverse Account',
      extras: 'AR55, thế giới level 8, 300+ resin mỗi ngày',
    },
  },
  {
    type: 'game_account',
    name: 'Tài Khoản Valorant – Iron → Radiant Smurf',
    price: 380000,
    description: 'Tài khoản Valorant sạch, level 50+, chưa rank. Phù hợp làm smurf hoặc tặng bạn bè.',
    stock: 3,
    tags: ['valorant', 'fps', 'smurf', 'pc'],
    accountInfo: {
      server: 'SEA – Singapore',
      level: 50,
      characters: 'Tất cả 22 agents mở khóa',
      items: '3 knife skin Legendary, 10+ gun skin Premium',
      loginMethod: 'Riot ID',
      extras: 'Level 50, Honor Level 5, email xác minh sẵn sàng',
    },
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
    name: 'VPS Nat CPU:1 Core Ram:1G Disk SSD 15G',
    price: 40000,
    description: 'VPS Nat CPU:1 Core Ram:1G Disk SSD 15G Hệ Điều hành: Windown Server 2012 Băng thông: không giới hạn Giá:40k/tháng',
    stock: 50,
    tags: ['vps', 'nat', 'windown server 2012'],
    vpsInfo: {
      ram: '1G',
      cpu: '1 Core',
      storage: '15G SSD',
      bandwidth: 'Không giới hạn',
      os: 'Windown Server 2012',
      location: 'Việt Nam',
      uptime: '99.9%',
    },
  },
  {
    type: 'vps',
    name: 'VPS Nat CPU:1 Core Ram:1G Disk SSD 15G (Tuần)',
    price: 15000,
    description: 'VPS Nat CPU:1 Core Ram:1G Disk SSD 15G Hệ Điều hành: Windown Server 2012 Băng thông: không giới hạn Giá:15k/tuần',
    stock: 50,
    tags: ['vps', 'nat', 'windown server 2012', 'tuần'],
    vpsInfo: {
      ram: '1G',
      cpu: '1 Core',
      storage: '15G SSD',
      bandwidth: 'Không giới hạn',
      os: 'Windown Server 2012',
      location: 'Việt Nam',
      uptime: '99.9%',
    },
  },
  {
    type: 'vps',
    name: 'VPS Nat CPU:2 Core Ram:2G Disk SSD 25G (Tuần)',
    price: 25000,
    description: 'VPS Nat CPU:2 Core Ram:2G Disk SSD 25G Hệ Điều hành: Windown Server 2012 Băng thông: không giới hạn Giá:25k/tuần',
    stock: 50,
    tags: ['vps', 'nat', 'windown server 2012', 'tuần'],
    vpsInfo: {
      ram: '2G',
      cpu: '2 Core',
      storage: '25G SSD',
      bandwidth: 'Không giới hạn',
      os: 'Windown Server 2012',
      location: 'Việt Nam',
      uptime: '99.9%',
    },
  },
  {
    type: 'vps',
    name: 'VPS Nat CPU:4 Core Ram:4G Disk SSD 40G (Tuần)',
    price: 30000,
    description: 'VPS Nat CPU:4 Core Ram:4G Disk SSD 40G Hệ Điều hành: Windown Server 2012 Băng thông: không giới hạn Giá:30k/tuần',
    stock: 50,
    tags: ['vps', 'nat', 'windown server 2012', 'tuần'],
    vpsInfo: {
      ram: '4G',
      cpu: '4 Core',
      storage: '40G SSD',
      bandwidth: 'Không giới hạn',
      os: 'Windown Server 2012',
      location: 'Việt Nam',
      uptime: '99.9%',
    },
  },
  {
    type: 'vps',
    name: 'VPS Nat CPU:8 Core Ram:8G Disk SSD 80G (Tuần)',
    price: 45000,
    description: 'VPS Nat CPU:8 Core Ram:8G Disk SSD 80G Hệ Điều hành: Windown Server 2012 Băng thông: không giới hạn Giá:45k/tuần',
    stock: 50,
    tags: ['vps', 'nat', 'windown server 2012', 'tuần'],
    vpsInfo: {
      ram: '8G',
      cpu: '8 Core',
      storage: '80G SSD',
      bandwidth: 'Không giới hạn',
      os: 'Windown Server 2012',
      location: 'Việt Nam',
      uptime: '99.9%',
    },
  },
  {
    type: 'vps',
    name: 'VPS IP Riêng CPU:1 Core Ram:1G Disk SSD 20G',
    price: 67000,
    description: 'VPS IP Riêng CPU:1 Core Ram:1G Disk SSD 20G Hệ Điều hành: Windown/Linux Băng thông: không giới hạn Giá:67k/tháng',
    stock: 50,
    tags: ['vps', 'ip riêng', 'windown', 'linux'],
    vpsInfo: {
      ram: '1G',
      cpu: '1 Core',
      storage: '20G SSD',
      bandwidth: 'Không giới hạn',
      os: 'Windown/Linux',
      location: 'Việt Nam',
      uptime: '99.9%',
    },
  },
  {
    type: 'vps',
    name: 'VPS IP Riêng CPU:1 Core Ram:2G Disk SSD 25G',
    price: 80000,
    description: 'VPS IP Riêng CPU:1 Core Ram:2G Disk SSD 25G Hệ Điều hành: Windown/Linux Băng thông: không giới hạn Giá:80k/tháng',
    stock: 50,
    tags: ['vps', 'ip riêng', 'windown', 'linux'],
    vpsInfo: {
      ram: '2G',
      cpu: '1 Core',
      storage: '25G SSD',
      bandwidth: 'Không giới hạn',
      os: 'Windown/Linux',
      location: 'Việt Nam',
      uptime: '99.9%',
    },
  },
  {
    type: 'vps',
    name: 'VPS IP Riêng CPU:2 Core Ram:2G Disk SSD 30G',
    price: 99000,
    description: 'VPS IP Riêng CPU:2 Core Ram:2G Disk SSD 30G Hệ Điều hành: Windown/Linux Băng thông: không giới hạn Giá:99k/tháng',
    stock: 50,
    tags: ['vps', 'ip riêng', 'windown', 'linux'],
    vpsInfo: {
      ram: '2G',
      cpu: '2 Core',
      storage: '30G SSD',
      bandwidth: 'Không giới hạn',
      os: 'Windown/Linux',
      location: 'Việt Nam',
      uptime: '99.9%',
    },
  },
  {
    type: 'vps',
    name: 'VPS IP Riêng CPU:2 Core Ram:4G Disk SSD 30G',
    price: 145000,
    description: 'VPS IP Riêng CPU:2 Core Ram:4G Disk SSD 30G Hệ Điều hành: Windown/Linux Băng thông: không giới hạn Giá:145k/tháng',
    stock: 50,
    tags: ['vps', 'ip riêng', 'windown', 'linux'],
    vpsInfo: {
      ram: '4G',
      cpu: '2 Core',
      storage: '30G SSD',
      bandwidth: 'Không giới hạn',
      os: 'Windown/Linux',
      location: 'Việt Nam',
      uptime: '99.9%',
    },
  },
  {
    type: 'vps',
    name: 'VPS IP Riêng CPU:3 Core Ram:6G Disk SSD 30G',
    price: 250000,
    description: 'VPS IP Riêng CPU:3 Core Ram:6G Disk SSD 30G Hệ Điều hành: Windown/Linux Băng thông: không giới hạn Giá:250k/tháng',
    stock: 50,
    tags: ['vps', 'ip riêng', 'windown', 'linux'],
    vpsInfo: {
      ram: '6G',
      cpu: '3 Core',
      storage: '30G SSD',
      bandwidth: 'Không giới hạn',
      os: 'Windown/Linux',
      location: 'Việt Nam',
      uptime: '99.9%',
    },
  },
  {
    type: 'vps',
    name: 'VPS IP Riêng CPU:4 Core Ram:4G Disk SSD 30G',
    price: 200000,
    description: 'VPS IP Riêng CPU:4 Core Ram:4G Disk SSD 30G Hệ Điều hành: Windown/Linux Băng thông: không giới hạn Giá:200k/tháng',
    stock: 50,
    tags: ['vps', 'ip riêng', 'windown', 'linux'],
    vpsInfo: {
      ram: '4G',
      cpu: '4 Core',
      storage: '30G SSD',
      bandwidth: 'Không giới hạn',
      os: 'Windown/Linux',
      location: 'Việt Nam',
      uptime: '99.9%',
    },
  },
  {
    type: 'vps',
    name: 'VPS IP Riêng CPU:6 Core Ram:6G Disk SSD 30G',
    price: 350000,
    description: 'VPS IP Riêng CPU:6 Core Ram:6G Disk SSD 30G Hệ Điều hành: Windown/Linux Băng thông: không giới hạn Giá:350k/tháng',
    stock: 50,
    tags: ['vps', 'ip riêng', 'windown', 'linux'],
    vpsInfo: {
      ram: '6G',
      cpu: '6 Core',
      storage: '30G SSD',
      bandwidth: 'Không giới hạn',
      os: 'Windown/Linux',
      location: 'Việt Nam',
      uptime: '99.9%',
    },
  },
  {
    type: 'vps',
    name: 'VPS IP Riêng CPU:4 Core Ram:8G Disk SSD 50G',
    price: 300000,
    description: 'VPS IP Riêng CPU:4 Core Ram:8G Disk SSD 50G Hệ Điều hành: Windown/Linux Băng thông: không giới hạn Giá:300k/tháng',
    stock: 50,
    tags: ['vps', 'ip riêng', 'windown', 'linux'],
    vpsInfo: {
      ram: '8G',
      cpu: '4 Core',
      storage: '50G SSD',
      bandwidth: 'Không giới hạn',
      os: 'Windown/Linux',
      location: 'Việt Nam',
      uptime: '99.9%',
    },
  },
  {
    type: 'vps',
    name: 'VPS IP Riêng CPU:8 Core Ram:16G Disk SSD 70G',
    price: 550000,
    description: 'VPS IP Riêng CPU:8 Core Ram:16G Disk SSD 70G Hệ Điều hành: Windown/Linux Băng thông: không giới hạn Giá:550k/tháng',
    stock: 50,
    tags: ['vps', 'ip riêng', 'windown', 'linux'],
    vpsInfo: {
      ram: '16G',
      cpu: '8 Core',
      storage: '70G SSD',
      bandwidth: 'Không giới hạn',
      os: 'Windown/Linux',
      location: 'Việt Nam',
      uptime: '99.9%',
    },
  },
  {
    type: 'vps',
    name: 'VPS IP Riêng CPU:8 Core Ram:32G Disk SSD 70G',
    price: 800000,
    description: 'VPS IP Riêng CPU:8 Core Ram:32G Disk SSD 70G Hệ Điều hành: Windown/Linux Băng thông: không giới hạn Giá:800k/tháng',
    stock: 50,
    tags: ['vps', 'ip riêng', 'windown', 'linux'],
    vpsInfo: {
      ram: '32G',
      cpu: '8 Core',
      storage: '70G SSD',
      bandwidth: 'Không giới hạn',
      os: 'Windown/Linux',
      location: 'Việt Nam',
      uptime: '99.9%',
    },
  },
  {
    type: 'vps',
    name: 'VPS CPU:2 Ram:8G',
    price: 100000,
    description: 'VPS CPU:2 Ram:8G Giá:100k/tháng',
    stock: 50,
    tags: ['vps'],
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
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed thất bại:', error);
    process.exit(1);
  }
};

runSeed();
