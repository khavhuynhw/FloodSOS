# Hướng Dẫn Setup Cloudinary

## Tại Sao Dùng Cloudinary?

- ✅ **Miễn phí:** 25GB storage, 25GB bandwidth/tháng
- ✅ **Dễ setup:** Không cần MinIO hay S3
- ✅ **Tự động optimize:** Resize, compress, format conversion
- ✅ **CDN tích hợp:** Ảnh load nhanh toàn cầu
- ✅ **Transformations:** Có thể resize, crop, filter trực tiếp từ URL

---

## Bước 1: Đăng Ký Cloudinary

1. Vào https://cloudinary.com/users/register/free
2. Đăng ký tài khoản miễn phí
3. Xác thực email

---

## Bước 2: Lấy Credentials

1. Vào Dashboard: https://console.cloudinary.com
2. Copy các thông tin sau:
   - **Cloud Name** (ví dụ: `dabc123`)
   - **API Key** (ví dụ: `123456789012345`)
   - **API Secret** (ví dụ: `abcdefghijklmnopqrstuvwxyz123456`)

⚠️ **Lưu ý:** API Secret là thông tin nhạy cảm, không chia sẻ công khai!

---

## Bước 3: Cấu Hình Environment Variables

### Local Development

Thêm vào `server/.env`:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Production (Render)

1. Vào Render → Web Service → Environment
2. Thêm các biến:
   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```
3. Click "Save Changes"
4. Service sẽ tự động redeploy

---

## Bước 4: Xóa S3/MinIO Config (Nếu Có)

Nếu trước đây dùng S3/MinIO, có thể xóa các biến sau (không bắt buộc):

```env
# Có thể xóa các dòng này
S3_ENDPOINT=...
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_BUCKET=...
S3_REGION=...
S3_USE_SSL=...
```

---

## Bước 5: Test Upload

1. Start backend server
2. Tạo yêu cầu cứu trợ với ảnh
3. Kiểm tra URL ảnh trả về có dạng:
   ```
   https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/floodrelief/...
   ```

---

## Cloudinary Free Tier Limits

- **Storage:** 25GB
- **Bandwidth:** 25GB/tháng
- **Transformations:** Unlimited
- **Upload size:** 10MB/file
- **Video:** 100MB/file

**Nếu vượt quá:** Upgrade lên paid plan hoặc optimize ảnh trước khi upload.

---

## Tối Ưu Hóa

### 1. Auto Format & Quality

Cloudinary tự động:
- Convert sang format tối ưu (WebP, AVIF)
- Compress với quality tốt nhất
- Resize theo device

### 2. Transformations

Có thể thêm transformations vào URL:

```
# Resize
https://res.cloudinary.com/.../w_800,h_600,c_fill/...

# Crop
https://res.cloudinary.com/.../c_fill,g_face/...

# Quality
https://res.cloudinary.com/.../q_auto:best/...
```

Xem thêm: https://cloudinary.com/documentation/image_transformations

---

## Troubleshooting

### Lỗi: "Cloudinary not configured"

**Nguyên nhân:** Thiếu environment variables

**Giải pháp:**
1. Kiểm tra `.env` có đầy đủ 3 biến:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
2. Restart server sau khi thêm biến

### Lỗi: "Invalid API credentials"

**Nguyên nhân:** API Key hoặc Secret sai

**Giải pháp:**
1. Kiểm tra lại credentials trong Cloudinary Dashboard
2. Copy lại chính xác (không có khoảng trắng)

### Ảnh Không Hiển Thị

**Nguyên nhân:** CORS hoặc URL sai

**Giải pháp:**
1. Cloudinary URLs tự động có CORS
2. Kiểm tra URL có đúng format không
3. Kiểm tra ảnh có upload thành công không (xem logs)

---

## Migration Từ S3/MinIO

Nếu đã có ảnh trên S3/MinIO:

1. **Option 1:** Giữ cả 2 (S3 cho ảnh cũ, Cloudinary cho ảnh mới)
2. **Option 2:** Migrate ảnh cũ lên Cloudinary (dùng script)
3. **Option 3:** Chỉ dùng Cloudinary cho ảnh mới

---

## Liên Kết Hữu Ích

- [Cloudinary Dashboard](https://console.cloudinary.com)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Image Transformations](https://cloudinary.com/documentation/image_transformations)

