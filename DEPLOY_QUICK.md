# Hướng Dẫn Deploy Nhanh

## 🚀 Deploy Trong 15 Phút

### Bước 1: Frontend - Vercel (5 phút)

1. Vào https://vercel.com/new
2. Import GitHub repo
3. **Cấu hình:**
   - Root Directory: `web`
   - Framework: Next.js
4. **Thêm Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=<sẽ điền sau khi deploy backend>
   NEXT_PUBLIC_WS_URL=<sẽ điền sau khi deploy backend>
   ```
5. Click Deploy → Lưu URL (ví dụ: `https://floodrelief.vercel.app`)

---

### Bước 2: Database - Render (3 phút)

1. Vào https://render.com và đăng ký/đăng nhập
2. **Tạo PostgreSQL:**
   - Dashboard → "New +" → "PostgreSQL"
   - **Name:** `floodrelief-db`
   - **Database:** `floodrelief`
   - **User:** `floodrelief_user` (hoặc để mặc định)
   - **Region:** Chọn gần bạn nhất
   - **Plan:** Free (hoặc Starter nếu cần)
   - Click "Create Database"
   - Copy **Internal Database URL** hoặc **External Database URL**

3. **Enable PostGIS:**
   - Vào Database → "Connect" → "psql"
   - Hoặc dùng Render Shell:
   - Click "Connect" → "Shell"
   - Chạy: `psql $DATABASE_URL`
   - Trong psql, chạy: `CREATE EXTENSION IF NOT EXISTS postgis;`
   - Exit: `\q`

---

### Bước 3: Backend - Render (5 phút)

1. **Tạo Web Service:**
   - Dashboard → "New +" → "Web Service"
   - **Connect GitHub:** Chọn repository của bạn
   - Click "Connect"

2. **Cấu hình Service:**
   - **Name:** `floodrelief-api`
   - **Region:** Chọn cùng region với database
   - **Branch:** `main` (hoặc branch bạn muốn deploy)
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build && npx prisma generate`
   - **Start Command:** `npm start`
   - **Plan:** Free (hoặc Starter nếu cần)

3. **Environment Variables:**
   - Click "Advanced" → "Add Environment Variable"
   - Thêm các biến sau:
   ```env
   DATABASE_URL=<paste Internal Database URL từ PostgreSQL service>
   JWT_SECRET=<tạo random: openssl rand -base64 32>
   PORT=3001
   NODE_ENV=production
   CORS_ORIGIN=https://floodrelief.vercel.app
   
   # S3 - Dùng AWS S3 hoặc tạm thời bỏ qua
   S3_ENDPOINT=https://s3.amazonaws.com
   S3_ACCESS_KEY=<your-key>
   S3_SECRET_KEY=<your-secret>
   S3_BUCKET=floodrelief-images
   S3_REGION=us-east-1
   S3_USE_SSL=true
   ```

4. **Deploy:**
   - Click "Create Web Service"
   - Render sẽ tự động build và deploy
   - Đợi build xong (5-10 phút lần đầu)

5. **Run Migration:**
   - Vào Web Service → "Shell"
   - Chạy: `npx prisma migrate deploy`
   - Hoặc thêm vào Build Command: `&& npx prisma migrate deploy`

6. **Lưu URL backend:**
   - URL sẽ là: `https://floodrelief-api.onrender.com`
   - (Render free tier có thể sleep sau 15 phút không dùng)

---

### Bước 4: Cập Nhật Frontend (2 phút)

1. Vào Vercel → Project → Settings → Environment Variables
2. Cập nhật:
   ```
   NEXT_PUBLIC_API_URL=https://floodrelief-api.railway.app
   NEXT_PUBLIC_WS_URL=https://floodrelief-api.railway.app
   ```
3. Redeploy

---

### Bước 5: Setup S3 (AWS) - 5 phút

1. Đăng nhập AWS Console
2. Tạo S3 bucket: `floodrelief-images`
3. Tạo IAM user với quyền S3
4. Lấy Access Key và Secret Key
5. Cập nhật vào Railway environment variables

---

## ✅ Kiểm Tra

1. Frontend: https://floodrelief.vercel.app
2. Backend Health: https://floodrelief-api.onrender.com/health
3. Test tạo yêu cầu cứu trợ
4. Kiểm tra dashboard hiển thị data

**Lưu ý Render Free Tier:**
- Service sẽ sleep sau 15 phút không dùng
- Lần đầu wake up có thể mất 30-60 giây
- Nên upgrade Starter plan ($7/tháng) để tránh sleep

---

## 🔧 Troubleshooting

**Lỗi CORS:**
- Kiểm tra `CORS_ORIGIN` có đúng frontend URL không

**Lỗi Database:**
- Kiểm tra PostGIS đã enable chưa
- Kiểm tra `DATABASE_URL` format

**Lỗi Build:**
- Xem logs trong Railway/Vercel
- Kiểm tra Node.js version (cần 18+)

