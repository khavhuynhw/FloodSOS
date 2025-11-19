# Hướng Dẫn Deploy FloodRelief Application

## Tổng Quan

Ứng dụng gồm 3 phần chính:
1. **Frontend (Next.js)** - Deploy trên Vercel (khuyên dùng) hoặc Netlify
2. **Backend (Fastify)** - Deploy trên Railway, Render, hoặc VPS
3. **Database & Storage** - PostgreSQL (với PostGIS) và S3/MinIO

---

## Phương Án 1: Deploy Đơn Giản (Khuyên Dùng)

### A. Frontend - Vercel (Miễn Phí)

#### Bước 1: Chuẩn bị
1. Đảm bảo code đã push lên GitHub
2. Đăng ký tài khoản Vercel: https://vercel.com

#### Bước 2: Deploy
1. Vào https://vercel.com/new
2. Import repository từ GitHub
3. **Cấu hình Project:**
   - **Root Directory:** `web`
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build` (hoặc để mặc định)
   - **Output Directory:** `.next` (hoặc để mặc định)

4. **Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.com
   NEXT_PUBLIC_WS_URL=https://your-backend-url.com
   ```

5. Click **Deploy**

#### Bước 3: Lấy URL Frontend
- Vercel sẽ tự động tạo URL: `https://your-project.vercel.app`
- Lưu URL này để cấu hình backend

---

### B. Backend - Render (Miễn Phí hoặc $7/tháng)

#### Bước 1: Chuẩn bị Database
1. Đăng ký Render: https://render.com
2. Tạo **PostgreSQL** service:
   - Dashboard → "New +" → "PostgreSQL"
   - Name: `floodrelief-db`
   - Database: `floodrelief`
   - Region: Chọn gần bạn nhất
   - Plan: Free (hoặc Starter $7/tháng)
   - Click "Create Database"
   - Copy **Internal Database URL** (sẽ dùng sau)

3. **Enable PostGIS:**
   - Vào PostgreSQL service → "Connect" → "Shell"
   - Chạy: `psql $DATABASE_URL`
   - Trong psql, chạy:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   \q
   ```

#### Bước 2: Setup S3 Storage
**Option 1: AWS S3 (Khuyên dùng cho production)**
1. Tạo S3 bucket trên AWS
2. Tạo IAM user với quyền S3
3. Lấy Access Key và Secret Key

**Option 2: Railway MinIO (Cho development)**
- Railway không hỗ trợ MinIO trực tiếp
- Nên dùng AWS S3 hoặc DigitalOcean Spaces

#### Bước 3: Deploy Backend
1. **Tạo Web Service:**
   - Dashboard → "New +" → "Web Service"
   - Connect GitHub repository
   - Chọn repository của bạn

2. **Cấu hình Service:**
   - **Name:** `floodrelief-api`
   - **Region:** Chọn cùng region với database
   - **Root Directory:** `server` ⚠️ **QUAN TRỌNG**
   - **Build Command:** `npm install && npm run build && npx prisma generate`
   - **Start Command:** `npm start`
   - **Plan:** Free (hoặc Starter $7/tháng để tránh sleep)

3. **Environment Variables:**
   ```env
   DATABASE_URL=<DATABASE_URL từ PostgreSQL service>
   JWT_SECRET=<tạo random string 32+ ký tự>
   PORT=3001
   NODE_ENV=production
   CORS_ORIGIN=https://your-frontend-url.vercel.app
   
   # S3 Configuration
   S3_ENDPOINT=https://s3.amazonaws.com
   S3_ACCESS_KEY=<your-aws-access-key>
   S3_SECRET_KEY=<your-aws-secret-key>
   S3_BUCKET=<your-bucket-name>
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

4. **Run Migrations:**
   - Vào Web Service → "Shell"
   - Chạy: `npx prisma migrate deploy`
   - Hoặc thêm vào build command: `&& npx prisma migrate deploy`

5. **Deploy:**
   - Click "Create Web Service"
   - Render tự động deploy
   - Đợi build xong (5-10 phút lần đầu)
   - Lấy URL backend (ví dụ: `https://floodrelief-api.onrender.com`)

**Lưu ý Render Free Tier:**
- Service sẽ sleep sau 15 phút không dùng
- Lần đầu wake up mất 30-60 giây
- Nên upgrade Starter plan ($7/tháng) cho production

#### Bước 4: Cập nhật Frontend
1. Vào Vercel → Project → Settings → Environment Variables
2. Cập nhật:
   ```
   NEXT_PUBLIC_API_URL=https://floodrelief-api.onrender.com
   NEXT_PUBLIC_WS_URL=https://floodrelief-api.onrender.com
   ```
3. Redeploy frontend

**Xem hướng dẫn chi tiết:** [DEPLOY_RENDER.md](./DEPLOY_RENDER.md)

---

## Phương Án 2: Deploy VPS (Tự Host)

### Yêu Cầu
- VPS với Ubuntu 20.04+
- Docker và Docker Compose đã cài
- Domain name (tùy chọn)

### Bước 1: Setup Server
```bash
# SSH vào VPS
ssh user@your-server-ip

# Clone repository
git clone https://github.com/your-username/your-repo.git
cd your-repo

# Cài đặt Docker Compose (nếu chưa có)
sudo apt update
sudo apt install docker.io docker-compose -y
```

### Bước 2: Cấu hình Environment
```bash
# Backend
cd server
cp .env.example .env
nano .env  # Sửa các giá trị

# Frontend
cd ../web
cp .env.example .env.local
nano .env.local  # Sửa các giá trị
```

### Bước 3: Setup Database và MinIO
```bash
# Khởi động Docker services
cd ..
docker-compose up -d

# Setup MinIO bucket
docker exec -it floodrelief-minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker exec -it floodrelief-minio mc mb local/floodrelief-images
docker exec -it floodrelief-minio mc anonymous set download local/floodrelief-images
```

### Bước 4: Deploy Backend
```bash
cd server
npm install
npm run build
npx prisma migrate deploy
npx prisma generate

# Sử dụng PM2 để chạy production
npm install -g pm2
pm2 start dist/index.js --name floodrelief-api
pm2 save
pm2 startup
```

### Bước 5: Deploy Frontend
```bash
cd web
npm install
npm run build

# Sử dụng PM2 với next start
pm2 start npm --name floodrelief-web -- start
pm2 save
```

### Bước 6: Setup Nginx Reverse Proxy
```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/floodrelief
```

Nội dung file:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/floodrelief /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Bước 7: Setup SSL với Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## Phương Án 3: Render (Miễn Phí Tier)

### Backend trên Render

1. **Tạo PostgreSQL Database:**
   - Dashboard → "New" → "PostgreSQL"
   - Copy connection string

2. **Deploy Backend:**
   - "New" → "Web Service"
   - Connect GitHub repo
   - **Settings:**
     - **Root Directory:** `server`
     - **Build Command:** `npm install && npm run build && npx prisma generate`
     - **Start Command:** `npm start`
   - **Environment Variables:** (giống Railway)

3. **Run Migrations:**
   - Vào Shell của service
   - Chạy: `npx prisma migrate deploy`

### Frontend trên Render

1. **Deploy Static Site:**
   - "New" → "Static Site"
   - Connect GitHub repo
   - **Settings:**
     - **Root Directory:** `web`
     - **Build Command:** `npm install && npm run build`
     - **Publish Directory:** `web/.next`
   - **Environment Variables:**
     ```
     NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
     NEXT_PUBLIC_WS_URL=https://your-backend.onrender.com
     ```

---

## Checklist Trước Khi Deploy

### Backend
- [ ] Database đã được tạo và có PostGIS extension
- [ ] S3 bucket đã được tạo và cấu hình
- [ ] Environment variables đã được set đầy đủ
- [ ] JWT_SECRET đã được tạo (random, 32+ ký tự)
- [ ] CORS_ORIGIN trỏ đúng frontend URL
- [ ] Migrations đã chạy (`prisma migrate deploy`)

### Frontend
- [ ] Environment variables đã set:
  - `NEXT_PUBLIC_API_URL`
  - `NEXT_PUBLIC_WS_URL`
- [ ] Build thành công (`npm run build`)

### Security
- [ ] JWT_SECRET mạnh và bảo mật
- [ ] HTTPS đã được enable
- [ ] CORS đã được cấu hình đúng
- [ ] Database credentials an toàn
- [ ] S3 credentials an toàn

---

## Testing Sau Khi Deploy

1. **Kiểm tra Frontend:**
   - Truy cập URL frontend
   - Thử tạo yêu cầu cứu trợ
   - Kiểm tra form hoạt động

2. **Kiểm tra Backend:**
   - Truy cập: `https://your-backend-url.com/health`
   - Phải trả về: `{"status":"ok","timestamp":"..."}`

3. **Kiểm tra Database:**
   - Tạo yêu cầu từ frontend
   - Kiểm tra database có record mới

4. **Kiểm tra Images:**
   - Upload ảnh khi tạo yêu cầu
   - Kiểm tra ảnh hiển thị trong dashboard

---

## Troubleshooting

### Lỗi CORS
- Kiểm tra `CORS_ORIGIN` trong backend có đúng frontend URL không
- Đảm bảo URL có `https://` nếu dùng HTTPS

### Lỗi Database Connection
- Kiểm tra `DATABASE_URL` format đúng
- Kiểm tra database đã enable PostGIS chưa
- Kiểm tra firewall/security groups

### Lỗi Image Upload
- Kiểm tra S3 credentials
- Kiểm tra bucket đã được tạo
- Kiểm tra bucket policy cho phép upload

### Lỗi Build
- Kiểm tra Node.js version (cần 18+)
- Kiểm tra dependencies đã install đầy đủ
- Xem build logs để biết lỗi cụ thể

---

## Monitoring & Maintenance

### Logs
- **Vercel:** Dashboard → Project → Logs
- **Railway:** Service → Deployments → View Logs
- **Render:** Service → Logs

### Database Backups
- Railway: Tự động backup hàng ngày
- Render: Cần setup manual backup
- VPS: Setup cron job để backup

### Updates
1. Push code mới lên GitHub
2. Platform tự động deploy (nếu đã setup auto-deploy)
3. Hoặc manual trigger deploy từ dashboard

---

## Chi Phí Ước Tính

### Miễn Phí (Hobby)
- **Vercel:** Free tier (đủ cho small app)
- **Railway:** $5 credit/tháng (đủ cho development)
- **Render:** Free tier (có giới hạn)

### Production (Paid)
- **Vercel Pro:** $20/tháng
- **Railway:** ~$10-20/tháng
- **AWS S3:** ~$5-10/tháng (tùy usage)
- **Database:** ~$10-20/tháng

**Tổng:** ~$45-70/tháng cho production

---

## Liên Kết Hữu Ích

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

