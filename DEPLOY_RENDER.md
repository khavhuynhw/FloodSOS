# Hướng Dẫn Deploy Lên Render

## Tổng Quan

Render là platform miễn phí (free tier) để deploy backend và database. Hướng dẫn này sẽ giúp bạn deploy FloodRelief lên Render.

---

## Bước 1: Đăng Ký Render

1. Vào https://render.com
2. Đăng ký bằng GitHub (khuyên dùng) hoặc email
3. Xác thực email nếu cần

---

## Bước 2: Tạo PostgreSQL Database

### 2.1. Tạo Database Service

1. Dashboard → Click "New +" → Chọn "PostgreSQL"
2. **Cấu hình:**
   - **Name:** `floodrelief-db` (hoặc tên bạn muốn)
   - **Database:** `floodrelief`
   - **User:** `floodrelief_user` (hoặc để mặc định)
   - **Region:** Chọn gần bạn nhất (ví dụ: Singapore, Frankfurt)
   - **PostgreSQL Version:** 15 (hoặc mới nhất)
   - **Plan:** 
     - **Free:** 90MB storage, phù hợp cho development
     - **Starter ($7/tháng):** 1GB storage, không sleep
   - Click "Create Database"

### 2.2. Lấy Connection String

1. Vào Database service vừa tạo
2. **Copy Database URL:**
   - **Internal Database URL:** Dùng cho services trong cùng Render
   - **External Database URL:** Dùng cho services bên ngoài Render
   - **Lưu ý:** Dùng Internal URL cho backend service trên Render

### 2.3. Enable PostGIS Extension

**Cách 1: Dùng Render Shell (Khuyên dùng)**

1. Vào Database service → Tab "Connect"
2. Click "Connect" → Chọn "psql" hoặc "Shell"
3. Nếu dùng Shell, chạy:
   ```bash
   psql $DATABASE_URL
   ```
4. Trong psql prompt, chạy:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   \q
   ```

**Cách 2: Dùng External Tool**

1. Cài đặt psql hoặc dùng pgAdmin
2. Kết nối với External Database URL
3. Chạy: `CREATE EXTENSION IF NOT EXISTS postgis;`

---

## Bước 3: Deploy Backend Service

### 3.1. Tạo Web Service

1. Dashboard → "New +" → "Web Service"
2. **Connect Repository:**
   - Chọn "Build and deploy from a Git repository"
   - Click "Connect" bên cạnh GitHub
   - Authorize Render nếu cần
   - Chọn repository của bạn
   - Click "Connect"

### 3.2. Cấu Hình Service

**Basic Settings:**
- **Name:** `floodrelief-api` (hoặc tên bạn muốn)
- **Region:** Chọn cùng region với database (để giảm latency)
- **Branch:** `main` (hoặc branch bạn muốn deploy)
- **Root Directory:** `server` ⚠️ **QUAN TRỌNG**
- **Runtime:** `Node`
- **Build Command:** 
   ```
   npm install && npm run build && npx prisma generate
   ```
- **Start Command:** 
   ```
   npm start
   ```
- **Plan:** 
   - **Free:** Có thể sleep sau 15 phút không dùng
   - **Starter ($7/tháng):** Không sleep, tốt hơn cho production

### 3.3. Environment Variables

Click "Advanced" → "Add Environment Variable", thêm:

```env
# Database
DATABASE_URL=<paste Internal Database URL từ PostgreSQL service>

# Server
PORT=3001
NODE_ENV=production

# JWT
JWT_SECRET=<tạo random string 32+ ký tự>
# Có thể dùng: openssl rand -base64 32

# CORS
CORS_ORIGIN=https://your-frontend-url.vercel.app
# Hoặc: http://localhost:3000 (nếu test local)

# S3 Storage (AWS S3)
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=<your-aws-access-key>
S3_SECRET_KEY=<your-aws-secret-key>
S3_BUCKET=floodrelief-images
S3_REGION=us-east-1
S3_USE_SSL=true

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS_PER_IP=10
RATE_LIMIT_TIME_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS_PER_PHONE=5
RATE_LIMIT_PHONE_TIME_WINDOW_MS=3600000

# Image Upload
MAX_IMAGE_SIZE_MB=5
MAX_IMAGES_PER_REQUEST=3
```

**Lưu ý:**
- `DATABASE_URL` phải dùng **Internal Database URL** (bắt đầu với `postgresql://`)
- `CORS_ORIGIN` phải là URL frontend (ví dụ: `https://floodrelief.vercel.app`)
- `JWT_SECRET` phải là random string mạnh (32+ ký tự)

### 3.4. Deploy

1. Click "Create Web Service"
2. Render sẽ tự động:
   - Clone repository
   - Install dependencies
   - Build project
   - Start service
3. Đợi build xong (5-10 phút lần đầu)
4. Xem logs để kiểm tra có lỗi không

### 3.5. Run Database Migrations

**Cách 1: Dùng Render Shell**

1. Vào Web Service → Tab "Shell"
2. Chạy:
   ```bash
   npx prisma migrate deploy
   ```

**Cách 2: Thêm vào Build Command**

Sửa Build Command thành:
```
npm install && npm run build && npx prisma generate && npx prisma migrate deploy
```

**Cách 3: Dùng Manual Deploy**

1. Vào Web Service → "Manual Deploy"
2. Chọn branch và commit
3. Trong "Deploy Command", thêm:
   ```
   npx prisma migrate deploy
   ```

### 3.6. Lấy URL Backend

1. Vào Web Service
2. URL sẽ là: `https://floodrelief-api.onrender.com`
3. Test health endpoint: `https://floodrelief-api.onrender.com/health`
4. Phải trả về: `{"status":"ok","timestamp":"..."}`

---

## Bước 4: Cập Nhật Frontend

### 4.1. Cập Nhật Environment Variables

1. Vào Vercel → Project → Settings → Environment Variables
2. Cập nhật:
   ```
   NEXT_PUBLIC_API_URL=https://floodrelief-api.onrender.com
   NEXT_PUBLIC_WS_URL=https://floodrelief-api.onrender.com
   ```
3. Click "Save"
4. Vào "Deployments" → Click "..." → "Redeploy"

---

## Bước 5: Setup S3 Storage (AWS)

### 5.1. Tạo S3 Bucket

1. Đăng nhập AWS Console
2. Vào S3 → "Create bucket"
3. **Cấu hình:**
   - **Bucket name:** `floodrelief-images` (phải unique globally)
   - **Region:** `us-east-1` (hoặc region bạn muốn)
   - **Block Public Access:** Bỏ chọn (hoặc cấu hình bucket policy)
   - Click "Create bucket"

### 5.2. Tạo IAM User

1. Vào IAM → "Users" → "Create user"
2. **User name:** `floodrelief-s3-user`
3. **Access type:** "Programmatic access"
4. **Permissions:** "Attach existing policies directly"
   - Chọn: `AmazonS3FullAccess` (hoặc tạo custom policy chỉ cho bucket này)
5. Click "Create user"
6. **Lưu Access Key ID và Secret Access Key** (chỉ hiện 1 lần)

### 5.3. Cấu Hình Bucket Policy

1. Vào S3 → Bucket → "Permissions" → "Bucket policy"
2. Thêm policy (cho phép read public):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::floodrelief-images/*"
       }
     ]
   }
   ```
3. Click "Save"

### 5.4. Cập Nhật Environment Variables

1. Vào Render → Web Service → "Environment"
2. Cập nhật:
   ```
   S3_ENDPOINT=https://s3.amazonaws.com
   S3_ACCESS_KEY=<paste Access Key ID>
   S3_SECRET_KEY=<paste Secret Access Key>
   S3_BUCKET=floodrelief-images
   S3_REGION=us-east-1
   S3_USE_SSL=true
   ```
3. Click "Save Changes"
4. Service sẽ tự động redeploy

---

## Kiểm Tra Sau Khi Deploy

### 1. Test Backend Health

```bash
curl https://floodrelief-api.onrender.com/health
```

Phải trả về:
```json
{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### 2. Test Frontend

1. Truy cập URL frontend (Vercel)
2. Thử tạo yêu cầu cứu trợ
3. Upload ảnh
4. Kiểm tra dashboard hiển thị data

### 3. Test Database

1. Vào Render → Database → "Connect" → "psql"
2. Chạy:
   ```sql
   SELECT COUNT(*) FROM "Request";
   ```
3. Nếu có data, database hoạt động tốt

---

## Troubleshooting

### Lỗi Build Failed

**Nguyên nhân:**
- Thiếu dependencies
- Build command sai
- Node version không đúng

**Giải pháp:**
1. Xem build logs trong Render
2. Kiểm tra `package.json` có đầy đủ dependencies
3. Thử build local: `cd server && npm install && npm run build`

### Lỗi Database Connection

**Nguyên nhân:**
- `DATABASE_URL` sai
- Database chưa enable PostGIS
- Firewall block

**Giải pháp:**
1. Kiểm tra `DATABASE_URL` dùng Internal URL
2. Enable PostGIS: `CREATE EXTENSION postgis;`
3. Kiểm tra database service đang running

### Lỗi CORS

**Nguyên nhân:**
- `CORS_ORIGIN` không đúng frontend URL
- URL có http/https không khớp

**Giải pháp:**
1. Kiểm tra `CORS_ORIGIN` trong environment variables
2. Đảm bảo URL có `https://` nếu frontend dùng HTTPS
3. Restart service sau khi sửa

### Service Sleep (Free Tier)

**Vấn đề:**
- Render free tier sleep sau 15 phút không dùng
- Lần đầu wake up mất 30-60 giây

**Giải pháp:**
1. Upgrade lên Starter plan ($7/tháng) - không sleep
2. Hoặc dùng service như UptimeRobot để ping định kỳ

### Lỗi Image Upload

**Nguyên nhân:**
- S3 credentials sai
- Bucket chưa được tạo
- Bucket policy chưa đúng

**Giải pháp:**
1. Kiểm tra S3 credentials trong environment variables
2. Kiểm tra bucket đã được tạo
3. Kiểm tra bucket policy cho phép upload

---

## Render Free Tier Limitations

- **Sleep:** Service sleep sau 15 phút không dùng
- **Wake time:** 30-60 giây để wake up
- **Database:** 90MB storage limit
- **Bandwidth:** Có giới hạn
- **Build time:** Có thể lâu hơn

**Khuyên dùng Starter plan ($7/tháng) cho production:**
- Không sleep
- 1GB database storage
- Nhanh hơn
- Support tốt hơn

---

## Monitoring & Logs

### Xem Logs

1. Vào Web Service → Tab "Logs"
2. Xem real-time logs
3. Có thể download logs

### Health Checks

Render tự động check health endpoint:
- `GET /health`
- Nếu fail, Render sẽ restart service

### Metrics

Render cung cấp metrics:
- CPU usage
- Memory usage
- Request count
- Response time

---

## Updates & Redeploy

### Auto Deploy

Render tự động deploy khi:
- Push code lên branch đã connect
- Merge PR vào main branch

### Manual Deploy

1. Vào Web Service → "Manual Deploy"
2. Chọn branch và commit
3. Click "Deploy"

### Rollback

1. Vào "Deployments"
2. Chọn deployment cũ
3. Click "Rollback"

---

## Chi Phí

### Free Tier
- **Web Service:** Free (có sleep)
- **PostgreSQL:** Free (90MB)
- **Tổng:** $0/tháng

### Starter Plan
- **Web Service:** $7/tháng (không sleep)
- **PostgreSQL:** $7/tháng (1GB)
- **Tổng:** $14/tháng

### Production (Recommended)
- **Web Service:** $7/tháng
- **PostgreSQL:** $20/tháng (10GB)
- **Tổng:** ~$27/tháng

---

## Liên Kết Hữu Ích

- [Render Documentation](https://render.com/docs)
- [Render PostgreSQL](https://render.com/docs/databases)
- [Render Web Services](https://render.com/docs/web-services)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)

