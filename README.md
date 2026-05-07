# WebShopAC – Bán Account Game & VPS (React + Express + MongoDB)

Website bán **tài khoản game** và **VPS** (không tích hợp thanh toán online). Người dùng tạo đơn hàng, hệ thống lưu DB và trả về link **redirect sang Zalo** (kèm nội dung đơn hàng) để admin chốt đơn.

## Tech stack

- **Frontend**: ReactJS (Vite) + TailwindCSS + Axios + Context API + React Router + React Toastify
- **Backend**: Node.js + Express (MVC + RESTful) + JWT + bcrypt + helmet + express-rate-limit + express-validator
- **Database**: MongoDB + Mongoose

## Cấu trúc thư mục

### Backend (`/backend`)

- `config/`, `models/`, `controllers/`, `routes/`, `middlewares/`, `utils/`, `seed/`, `server.js`

### Frontend (`/frontend/src`)

- `components/`, `pages/`, `services/`, `context/`, `App.jsx`

## Tính năng

### User

- Xem danh sách sản phẩm (fetch từ API) gồm 2 loại:
  - **Game account**: `name`, `price`, `description`, `accountInfo`
  - **VPS**: `name`, `RAM`, `CPU`, `price`, `description`
- Search / filter / pagination
- Giỏ hàng: thêm/xóa/cập nhật số lượng, lưu `localStorage`
- Đăng ký / đăng nhập JWT
- Tạo đơn hàng → lưu DB với `status = pending_contact` → trả về `zaloUrl` để mở Zalo
- Xem lịch sử đơn hàng (fetch từ API)

### Admin (`/admin`)

- Tài khoản mặc định (seed):
  - **username**: `nguyenduong`
  - **password**: `Duong@43`
  - (có thể login bằng username hoặc email `nguyenduong@admin.com`)
- CRUD sản phẩm (game account/VPS)
- Quản lý user (xem danh sách, vô hiệu hóa/khôi phục)
- Quản lý đơn hàng (xem tất cả, cập nhật trạng thái: `pending_contact`, `completed`, `cancelled`)
- Dashboard (tổng đơn, doanh thu, tổng user… cập nhật từ API)

## Cài đặt & chạy project (Windows/PowerShell)

### 1) Cài MongoDB

- Cài MongoDB Community Server và đảm bảo service đang chạy.
- Mặc định project dùng: `mongodb://localhost:27017/webshopac`

### 2) Backend

Mở terminal tại thư mục `backend/`:

```bash
cd backend
npm install
copy .env.example .env
```

Chỉnh `.env` (ít nhất `MONGODB_URI`, `JWT_SECRET`, `ZALO_PHONE`), sau đó:

```bash
npm run seed
npm run dev
```

API chạy tại `http://localhost:5000/api` (health check: `GET /api/health`).

### 3) Frontend

Mở terminal tại thư mục `frontend/`:

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend chạy tại `http://localhost:5173`.

## Seed data

Backend có sẵn script:

```bash
cd backend
npm run seed
```

Seed sẽ tạo:

- 1 admin + 2 user
- 5 game account + 5 VPS
- một vài đơn hàng mẫu

## Ghi chú triển khai (production)

- Đặt `NODE_ENV=production`
- Dùng `JWT_SECRET` đủ mạnh
- Cấu hình `CLIENT_URL` đúng domain frontend để CORS hoạt động
- Nên đặt reverse proxy (Nginx) và bật HTTPS

"# Shop_WebBanVPS_TKGame" 
