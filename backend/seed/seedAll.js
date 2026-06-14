// seed/seedAll.js - Chạy tất cả các script seed một cách tuần tự
const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Bắt đầu chạy toàn bộ Seed scripts...\n');

try {
  console.log('--- 1. Seeding Dữ Liệu Cơ Bản (Users, Products, Orders) ---');
  execSync(`node "${path.join(__dirname, 'seedData.js')}"`, { stdio: 'inherit' });

  console.log('\n--- 2. Seeding Đố Vui Sinh Tồn (Topics, Questions) ---');
  execSync(`node "${path.join(__dirname, 'seedTrivia.js')}"`, { stdio: 'inherit' });

  console.log('\n--- 3. Seeding Vòng Quay May Mắn (Wheels, Prizes) ---');
  execSync(`node "${path.join(__dirname, 'seedWheels.js')}"`, { stdio: 'inherit' });

  console.log('\n🎉 HOÀN TẤT TOÀN BỘ QUÁ TRÌNH SEED!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Quá trình Seed thất bại ở một bước nào đó. Vui lòng kiểm tra log ở trên!');
  process.exit(1);
}
