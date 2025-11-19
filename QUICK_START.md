# Hướng Dẫn Chạy Ứng Dụng FloodRelief

## Bước 1: Khởi động Infrastructure (Database, MinIO)

Mở terminal và chạy:

```bash
docker-compose up -d
```

Lệnh này sẽ khởi động:
- PostgreSQL (database) trên port 5432
- MinIO (lưu trữ ảnh) trên port 9000
- Redis (tùy chọn) trên port 6379

Kiểm tra xem các service đã chạy chưa:
```bash
docker ps
```

## Bước 2: Setup Backend

Mở terminal mới và chạy:

```bash
cd server
npm install
```

Tạo file `.env`:
```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Mac/Linux
cp .env.example .env
```

File `.env` sẽ có nội dung mặc định (đã đúng cho local development):
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/floodrelief?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="floodrelief-images"
S3_REGION="us-east-1"
PORT=3001
CORS_ORIGIN="http://localhost:3000"
```

Chạy database migrations:
```bash
npx prisma migrate dev
npx prisma generate
```

Tạo admin user (tùy chọn, vì giờ không cần auth):
```bash
npm run seed
```

Khởi động backend server:
```bash
npm run dev
```

Backend sẽ chạy tại: http://localhost:3001

## Bước 3: Setup Frontend

Mở terminal mới và chạy:

```bash
cd web
npm install
```

Tạo file `.env.local`:
```bash
# Windows (PowerShell)
Copy-Item .env.example .env.local

# Mac/Linux
cp .env.example .env.local
```

File `.env.local` sẽ có:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

Khởi động frontend:
```bash
npm run dev
```

Frontend sẽ chạy tại: http://localhost:3000

## Bước 4: Truy cập Ứng dụng

1. **Trang chủ (Form công khai)**: http://localhost:3000
   - Điền form để tạo request mới
   - Upload ảnh (tùy chọn)
   - Chọn vị trí trên bản đồ

2. **Admin Dashboard**: http://localhost:3000/admin
   - Xem tất cả requests trên bản đồ
   - Xem danh sách trong bảng
   - Cập nhật status, resolve requests
   - Real-time updates khi có request mới

## Troubleshooting

### Lỗi database connection
```bash
# Kiểm tra PostgreSQL đã chạy chưa
docker ps | grep postgres

# Nếu chưa chạy, restart
docker-compose restart postgres
```

### Lỗi MinIO (S3)
```bash
# Kiểm tra MinIO đã chạy chưa
docker ps | grep minio

# Truy cập MinIO console: http://localhost:9001
# Login: minioadmin / minioadmin
# Tạo bucket tên "floodrelief-images" nếu chưa có
```

### Lỗi port đã được sử dụng
- Backend (3001): Đổi PORT trong `server/.env`
- Frontend (3000): Đổi port trong `web/package.json` script hoặc dùng `npm run dev -- -p 3002`

### Reset database
```bash
cd server
npx prisma migrate reset
npx prisma migrate dev
```

## Tóm tắt các lệnh

```bash
# Terminal 1: Infrastructure
docker-compose up -d

# Terminal 2: Backend
cd server
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma generate
npm run dev

# Terminal 3: Frontend
cd web
npm install
cp .env.example .env.local
npm run dev
```

Sau đó mở browser:
- http://localhost:3000 (Form công khai)
- http://localhost:3000/admin (Admin dashboard)

