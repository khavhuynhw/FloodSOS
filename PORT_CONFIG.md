# Hướng Dẫn Cấu Hình Port

## 1. Backend Server (Port 3001)

### File: `server/.env`

Thêm hoặc sửa dòng:
```env
PORT=3001
```

**Lưu ý:** Nếu đổi port backend, cần cập nhật `NEXT_PUBLIC_API_URL` trong frontend.

---

## 2. Frontend Web (Port 3000)

### Cách 1: Sửa trong `web/package.json`

Sửa script `dev`:
```json
"dev": "next dev -p 3000"
```

### Cách 2: Tạo file `web/.env.local`

Tạo file `web/.env.local` và thêm:
```env
PORT=3000
```

**Lưu ý:** Nếu đổi port frontend, cần cập nhật `CORS_ORIGIN` trong backend.

---

## 3. Cấu Hình Liên Quan

### Backend `.env` - CORS_ORIGIN

Nếu đổi port frontend, sửa trong `server/.env`:
```env
CORS_ORIGIN="http://localhost:3000"
```

### Frontend `.env.local` - API URL

Nếu đổi port backend, tạo file `web/.env.local` và thêm:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

---

## Ví Dụ: Đổi Port

### Đổi Backend từ 3001 → 4001:

1. **`server/.env`:**
   ```env
   PORT=4001
   ```

2. **`web/.env.local`** (tạo mới nếu chưa có):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4001
   NEXT_PUBLIC_WS_URL=http://localhost:4001
   ```

### Đổi Frontend từ 3000 → 4000:

1. **`web/package.json`:**
   ```json
   "dev": "next dev -p 4000"
   ```

2. **`server/.env`:**
   ```env
   CORS_ORIGIN="http://localhost:4000"
   ```

---

## Mặc Định

- **Backend:** `http://localhost:3001`
- **Frontend:** `http://localhost:3000`

