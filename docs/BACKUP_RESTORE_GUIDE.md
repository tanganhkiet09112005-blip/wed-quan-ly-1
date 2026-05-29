# Hướng dẫn Backup và Restore (Phụ lục Kỹ thuật)

> **Lưu ý:** Tài liệu này dành cho Quản trị viên (Sysadmin/DevOps).

## 1. Backup (Sao lưu)

### A. Sao lưu Dữ liệu Database
Hệ thống sử dụng **PostgreSQL** kết hợp với ORM **Prisma**.
- Khuyến nghị dùng **Supabase** (hoặc nền tảng tương đương) để được hỗ trợ PITR (Point-in-Time Recovery) tự động.
- **Thực hiện thủ công:**
  1. Cài đặt PostgreSQL Client.
  2. Dùng lệnh pg_dump:
     ```bash
     pg_dump -U postgres -h [DB_HOST] -d [DB_NAME] -F c -f backup_hship_$(date +%F).dump
     ```
  3. Tần suất: Lên lịch cron job backup database mỗi đêm lúc 2h sáng.

### B. Sao lưu Biến Môi Trường (ENV)
Biến môi trường trên Production (thường deploy ở Vercel) là phần vô cùng quan trọng:
- Đăng nhập Vercel -> Project Hship -> Settings -> Environment Variables.
- Lưu lại danh sách các biến quan trọng như `DATABASE_URL`, `NEXTAUTH_SECRET`, `WEBHOOK_SECRET` vào một phần mềm quản lý mật khẩu an toàn (như 1Password, Bitwarden).
- **Cấm kỵ:** Tuyệt đối không push file `.env.production` lên GitHub.

### C. Sao lưu Mã Nguồn (Source Code)
Mã nguồn nằm trên GitHub.
- Trước khi deploy tính năng mới, tạo một Git Tag/Release:
  ```bash
  git tag v1.1.0
  git push origin v1.1.0
  ```
- Việc này giúp dễ dàng rollback về phiên bản code chuẩn nếu deploy xảy ra lỗi vặt.

## 2. Restore (Khôi phục dữ liệu)

### Khi nào cần Restore?
- Khi vô tình xóa nhầm dữ liệu quan trọng (toàn bộ danh sách đơn hàng).
- Khi có lỗi bảo mật hoặc Database bị tấn công (Ransomware).
- Khi deploy bản cập nhật làm hỏng cấu trúc Prisma Schema mà không thể revert.

### Các bước Restore Database:
1. Thông báo bảo trì hệ thống tới các shop.
2. Chạy lệnh pg_restore:
   ```bash
   pg_restore -U postgres -h [DB_HOST] -d [DB_NAME] -1 backup_hship_xxxx.dump
   ```
3. Restart lại server hoặc Redeploy trên Vercel để clear cache.

### Các bước Rollback Code (Trường hợp DB an toàn nhưng code lỗi):
1. Vào Vercel Dashboard -> Tab **Deployments**.
2. Tìm kiếm bản deploy màu xanh lá cây (Success) gần nhất của ngày hôm qua/tuần trước.
3. Click dấu 3 chấm -> Chọn **Assign Custom Domain** hoặc **Promote to Production / Instant Rollback**. 
4. Hệ thống sẽ ngay lập tức quay lại phiên bản UI và logic cũ mà không cần chờ build.

### Kiểm tra sức khỏe hệ thống sau khi Restore:
Sau khi khôi phục xong, Admin cần login vào `/login` bằng tài khoản admin và kiểm tra:
1. Đăng nhập thành công chưa?
2. Bảng khách hàng CRM (`/customer/clients`) và Blacklist có tải được dữ liệu cũ không?
3. Tab **Production Credential** có hiển thị đúng trạng thái xanh/đỏ của API Key không? (Rất quan trọng, nếu mất key thì hệ thống sẽ ngừng sync đơn hàng sàn).
