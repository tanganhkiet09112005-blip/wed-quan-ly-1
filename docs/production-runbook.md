# Production Runbook

Tài liệu hướng dẫn vận hành, triển khai và ứng phó sự cố trên môi trường Production thực tế.

## 1. Thiết lập Biến môi trường (.env)
Sao chép `.env.example` thành `.env` trên máy chủ và cập nhật đầy đủ các giá trị bảo mật:

```bash
# Database kết nối thật
DATABASE_URL="mysql://hship_prod_user:SecurePassword123@prod-db-host:3306/hship_prod"

# Khóa phiên và mã hóa (BẮT BUỘC có độ dài 32 kí tự cho ENCRYPTION_KEY)
SESSION_SECRET="phai_la_mot_chuoi_sieu_bao_mat_va_ngau_nhien_dai_tren_32_ky_tu"
ENCRYPTION_KEY="12345678901234567890123456789012" # Khóa AES-256 mã hóa token ĐVVC

# URL ứng dụng của bạn (không có dấu gạch chéo cuối)
NEXT_PUBLIC_APP_URL="https://ship.giasuuviet.com"

# Webhook Security
WEBHOOK_SECRET="chuoi_verify_webhook_cho_carrier_neu_co"

# Meta / Facebook App Integration
FACEBOOK_APP_SECRET="app_secret_tu_meta_developer_portal"
FACEBOOK_VERIFY_TOKEN="chuoi_verify_token_tu_dat_tren_meta_webhook"

# Các API Base URL của Carrier trong Production
GHN_API_BASE_URL="https://online-gateway.ghn.vn"
GHTK_API_BASE_URL="https://services.giaohangtietkiem.vn"
JT_API_BASE_URL="https://jtexpress.vn/api"
SPX_API_BASE_URL="https://open-api.spx.vn"

# Cấu hình mức log hệ thống (debug, info, warn, error)
LOG_LEVEL="info"
```

## 2. Di cư Database (Prisma Migrations)
Trên máy chủ sản xuất, thực hiện các bước sau để cập nhật cấu trúc bảng mà không làm mất dữ liệu hiện tại:

```bash
# 1. Sinh mã Prisma Client mới nhất
npx prisma generate

# 2. Áp dụng tất cả các file migration chưa được deploy lên DB thật
npx prisma migrate deploy

# 3. Tạo tài khoản Admin mặc định cho hệ thống nếu DB trống (Production Seed)
npx node prisma/seed-production.js
```

## 3. Khởi tạo tài khoản Admin Production
Cần chuẩn bị file `prisma/seed-production.js` để kiểm tra nếu bảng `User` chưa có tài khoản admin nào thì tạo một tài khoản admin ban đầu với mật khẩu bảo mật (được băm bằng `scrypt`).

## 4. Quy trình Cấu hình Shop & ĐVVC
1. Đăng nhập vào trang Admin Portal -> Tạo tài khoản shop mới.
2. Cấp tài khoản cho Shop User đăng nhập vào `/customer`.
3. Trong giao diện Shop Portal -> Chọn **Đơn vị vận chuyển**:
   * Chọn nhà vận chuyển (ví dụ: GHN).
   * Đổi chế độ sang **Production**.
   * Nhập `Shop ID` và `API Token` thật.
   * Ấn nút **Lưu cấu hình**.
   * Ấn nút **Test connection** để hệ thống gọi thử API GHN kiểm tra token hợp lệ trước khi cho phép lưu/bật carrier.

## 5. Quy trình cấu hình Webhook Facebook
1. Vào `developers.facebook.com` -> Chọn App của bạn.
2. Vào phần cấu hình **Webhooks** -> Chọn **Page**.
3. Điền Callback URL: `https://ship.giasuuviet.com/api/facebook/webhook`
4. Điền Verify Token: trùng khớp với `FACEBOOK_VERIFY_TOKEN` trong file `.env`.
5. Bấm Verify and Save.
6. Đăng ký nhận các event: `messages`, `messaging_postbacks`, `feed` (để bắt livestream/bình luận).

## 6. Quy trình Sao lưu & Phục hồi dữ liệu (Backup & Restore)
* **Sao lưu tự động hàng ngày (Cronjob):**
  ```bash
  mysqldump -u hship_prod_user -pSecurePassword123 hship_prod | gzip > /backups/db/hship_prod_$(date +%F).sql.gz
  ```
* **Khôi phục dữ liệu:**
  ```bash
  gunzip < /backups/db/hship_prod_2026-05-28.sql.gz | mysql -u hship_prod_user -pSecurePassword123 hship_prod
  ```

## 7. Kế hoạch ứng phó Sự cố & Rollback
* **Khi API ĐVVC gặp sự cố hoặc quá tải:**
  * Shop có thể tạm thời chuyển trạng thái Carrier config từ `production` sang `mock` hoặc `sandbox` để tránh nghẽn tạo đơn nháp.
* **Quy trình hạ cấp phiên bản (Rollback Code):**
  1. Khi bản release mới bị lỗi nghiêm trọng, thực hiện checkout lại commit ổn định gần nhất:
     ```bash
     git checkout <last_stable_commit>
     ```
  2. Build lại ứng dụng:
     ```bash
     npm run build
     pm2 restart hship-app
     ```
  3. Nếu có lỗi cấu trúc DB, khôi phục lại bản backup DB gần nhất trước thời điểm release.
