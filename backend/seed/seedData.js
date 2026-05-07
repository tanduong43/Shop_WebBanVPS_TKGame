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
    email: 'nguyenduong@admin.com',
    password: 'Duong@43',
    role: 'admin',
  },
  {
    username: 'testuser',
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

  // ─── 5 VPS ─────────────────────────────────────────────────────────────────
  {
    type: 'vps',
    name: 'VPS Starter – Khởi Đầu Hoàn Hảo',
    price: 99000,
    description: 'VPS cấu hình nhẹ, phù hợp hosting website nhỏ, blog, hoặc bot Discord/Telegram. Uptime 99.9%.',
    stock: 50,
    tags: ['vps', 'hosting', 'bot', 'starter'],
    vpsInfo: {
      ram: '1 GB',
      cpu: '1 vCPU',
      storage: '20 GB SSD NVMe',
      bandwidth: '1 TB / tháng',
      os: 'Ubuntu 22.04 / Windows Server 2019',
      location: 'Singapore',
      uptime: '99.9%',
    },
  },
  {
    type: 'vps',
    name: 'VPS Standard – Dành Cho Developer',
    price: 199000,
    description: 'VPS ổn định, tốc độ cao. Lý tưởng cho ứng dụng web, API server, game server nhỏ.',
    stock: 30,
    tags: ['vps', 'developer', 'web hosting', 'api'],
    vpsInfo: {
      ram: '2 GB',
      cpu: '2 vCPU',
      storage: '40 GB SSD NVMe',
      bandwidth: '2 TB / tháng',
      os: 'Ubuntu 22.04 / CentOS 8 / Windows Server 2022',
      location: 'Singapore / Vietnam',
      uptime: '99.9%',
    },
  },
  {
    type: 'vps',
    name: 'VPS Professional – Hiệu Năng Cao',
    price: 399000,
    description: 'VPS mạnh mẽ cho ứng dụng lớn, e-commerce, database server. CPU AMD EPYC thế hệ mới.',
    stock: 20,
    tags: ['vps', 'professional', 'high performance', 'ecommerce'],
    vpsInfo: {
      ram: '4 GB',
      cpu: '4 vCPU AMD EPYC',
      storage: '80 GB SSD NVMe',
      bandwidth: '5 TB / tháng',
      os: 'Ubuntu 22.04 / Debian 12 / Windows Server 2022',
      location: 'Singapore / Japan / US',
      uptime: '99.95%',
    },
  },
  {
    type: 'vps',
    name: 'VPS Enterprise – Cho Doanh Nghiệp',
    price: 799000,
    description: 'VPS cấp doanh nghiệp, SLA 99.99%, dedicated resources, hỗ trợ 24/7. Tối ưu cho traffic cao.',
    stock: 10,
    tags: ['vps', 'enterprise', 'business', 'high traffic'],
    vpsInfo: {
      ram: '8 GB',
      cpu: '8 vCPU AMD EPYC',
      storage: '160 GB SSD NVMe RAID',
      bandwidth: 'Unlimited',
      os: 'Tất cả hệ điều hành phổ biến',
      location: 'Singapore / HK / US / EU',
      uptime: '99.99%',
    },
  },
  {
    type: 'vps',
    name: 'VPS Game Server – Tối Ưu Cho Game',
    price: 549000,
    description: 'VPS được tối ưu đặc biệt cho game server: Minecraft, CS:GO, FiveM, MTA. Ping thấp, DDoS Protection.',
    stock: 15,
    tags: ['vps', 'game server', 'minecraft', 'csgo', 'fivem', 'ddos protection'],
    vpsInfo: {
      ram: '6 GB DDR5',
      cpu: '6 vCPU Intel Xeon',
      storage: '100 GB SSD NVMe',
      bandwidth: '10 TB / tháng',
      os: 'Ubuntu 22.04 / Windows Server 2022',
      location: 'Singapore (ping thấp nhất VN)',
      uptime: '99.9% + DDoS Protection 1Gbps',
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
