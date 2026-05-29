# FEATURE STABILITY AUDIT: ADMIN HIERARCHY & PRICING
> **Chức năng:** Admin con & Bảng giá cước theo Shop
> **Ngày Audit:** 29/05/2026
> **Trạng thái:** READY FOR PRODUCTION MIGRATION

## 1. Tổng quan tính năng đã kiểm tra
Quá trình kiểm tra đã xác nhận các tính năng sau được bổ sung an toàn:
1. Admin tổng (SUPER_ADMIN) có thể tạo và quản lý Admin con.
2. Admin con có thể tạo/quản lý shop thuộc quyền mình.
3. SUPER_ADMIN và Admin con có thể cấu hình bảng giá riêng theo từng shop.
4. Bảng giá hỗ trợ cấu hình theo nhiều mốc cân, chống chồng lấp (overlap).
5. Khi shop đăng nhập lên đơn, hệ thống tự động tính cước theo bảng giá của riêng shop đó.
6. Order lưu snapshot `shippingFee` tại thời điểm tạo đơn, đảm bảo đơn cũ không bị thay đổi phí khi bảng giá mới được cập nhật.

## 2. Database & Migration Audit
- `User.parentAdminId` đã được thêm (Nullable).
- `Shop.adminId` đã được thêm (Nullable).
- `Order.weight` và `Order.appliedRateTierId` đã được thêm (Nullable).
- Đã tạo bảng `ShopShippingRate` và `ShopShippingRateTier` an toàn.
- Migration File (`prisma/migrations/add_admin_hierarchy_pricing.sql`) chỉ dùng `ADD COLUMN` và `CREATE TABLE`, hoàn toàn không có lệnh `DROP`, đảm bảo tương thích 100% với dữ liệu hiện tại. `npx prisma validate` và `generate` hoạt động chuẩn.

## 3. Auth & Permission Audit
- `isSuperAdmin` (role = admin, parentAdminId = null) và `isSubAdmin` (role = admin, parentAdminId != null) đã phân cấp triệt để.
- Middleware / Helper bắt đúng:
  - `SUPER_ADMIN` quản lý mọi Shop.
  - `ADMIN con` chỉ truy cập/cấu hình shop có `adminId = currentUser.id`.
  - `SHOP` chỉ lên đơn và xem đúng shop của mình, không có quyền can thiệp bảng giá cước.

## 4. API Audit
- **`GET/POST/PATCH /api/admin/accounts`**: Chặn 100% nếu không phải `SUPER_ADMIN`. Không leak `password` trong response.
- **`/api/shops`**: Lọc danh sách đúng thẩm quyền. Shop cũ `adminId = null` vẫn hoạt động tốt dưới sự quản lý của `SUPER_ADMIN`.
- **`/api/shops/[id]/pricing`**: Validate `minWeight < maxWeight`, chống overlap mốc cân hoàn chỉnh.
- **`/api/shops/[id]/calculate-fee`**: Tính phí chuẩn xác, thông báo rõ khi Shop chưa có bảng giá hoặc không có mốc cân tương ứng.
- **`POST /api/orders`**: Lưu `weight` và `appliedRateTierId`, lấy snapshot `shippingFee` chính xác.

## 5. UI Audit
- **`/admin/accounts`**: Hiển thị bảng Admin con với đầy đủ Form tạo mới, đổi trạng thái khóa/mở khóa. Chỉ `SUPER_ADMIN` xem được trang này.
- **`/admin/shops`**: Có thêm cột Admin quản lý, hiển thị "Admin tổng" với shop cũ. Thêm nút Cấu hình bảng giá.
- **`/admin/shops/[id]/pricing`**: UI thêm/sửa/xóa mốc giá hoạt động mượt mà, phản hồi báo lỗi overlap rõ ràng.
- **`/customer/orders/create`**: Ô điền trọng lượng tích hợp *debounce* gọi hàm tính phí thông minh, khóa cứng field phí khi đã load được cấu hình tự động. Cảnh báo đỏ nếu Shop chưa có bảng giá.

## 6. Logic tính cước Audit
- Việc tính cước luôn bám theo ID của Shop, loại trừ khả năng gian lận gọi API với Shop ID khác.
- Không có mốc cước = Không cho gán giá tùy tiện, yêu cầu liên hệ Admin.

## 7. Dashboard / Order / Report Regression Audit
- Cột `shippingFee` trong Order là dạng Snapshot Float.
- Đơn cũ vẫn giữ nguyên cước vận chuyển, không bị tính lại khi đổi bảng giá.
- Dashboard và Profit Report kế thừa `shippingFee` Snapshot nên báo cáo không bị sai lệch.

## 8. Security Audit
- Không leak PasswordHash, DATABASE_URL hay Token.
- Không tồn tại route quản trị bị Bypass quyền.
- API tính phí và tạo đơn kiểm tra chéo (Cross-check) dữ liệu tại Server-side.

## 9. Danh sách lỗi phát hiện
- Frontend form tạo Shop (`/admin/shops`) gặp lỗi cảnh báo liên quan đến `colSpan` của bảng dữ liệu bị lệch sau khi thêm cột Admin quản lý.

## 10. Danh sách lỗi đã fix
- Đã sửa lại thuộc tính `colSpan={13}` trong file `app/admin/shops/page.js`.

## 11. Danh sách file đã sửa
- `prisma/schema.prisma`
- `prisma/migrations/add_admin_hierarchy_pricing.sql`
- `lib/server/auth.js`
- `app/api/admin/accounts/route.js`
- `app/api/admin/accounts/[id]/route.js`
- `app/api/shops/route.js`
- `app/api/shops/[id]/pricing/route.js`
- `app/api/shops/[id]/pricing/[tierId]/route.js`
- `app/api/shops/[id]/calculate-fee/route.js`
- `app/api/orders/route.js`
- `app/admin/layout.js`
- `app/admin/accounts/page.js`
- `app/admin/shops/page.js`
- `app/admin/shops/[id]/pricing/page.js`
- `app/customer/orders/create/page.js`
- `docs/HSHIP_HUONG_DAN_SU_DUNG_VA_BAN_GIAO_A_Z.md`
- `docs/FINAL_PRODUCTION_AUDIT_REPORT.md`

## 12. Kết quả test case
1. SUPER_ADMIN tạo Admin con: **PASS**
2. Admin con đăng nhập được: **PASS**
3. Admin con tạo shop con thành công: **PASS**
4. SUPER_ADMIN tạo shop và gán cho Admin con: **PASS**
5. Admin con chỉ thấy shop của mình: **PASS**
6. Admin con không thấy shop của Admin khác: **PASS**
7. SUPER_ADMIN set bảng giá Shop A: **PASS**
8. ADMIN con set bảng giá Shop B: **PASS**
9. Shop lên đơn 5kg → tính chuẩn theo bảng giá: **PASS**
10. Shop chưa có bảng giá → báo cần liên hệ Admin: **PASS**
11. Tạo mốc cân overlap → bị chặn: **PASS**
12. SHOP gọi API sửa bảng giá → bị 403: **PASS**
13. ADMIN sửa shop không thuộc quyền → bị 403: **PASS**
14. Đơn cũ giữ nguyên shippingFee sau khi đổi bảng giá: **PASS**
15. Dashboard vẫn load đúng: **PASS**
16. Báo cáo lợi nhuận vẫn load đúng: **PASS**
17. Refresh route trực tiếp không lỗi: **PASS**

## 13. Kết quả lệnh Build
- `npx prisma validate`: **PASS**
- `npx prisma generate`: **PASS**
- `npm run lint`: **PASS**
- `npm run build`: **PASS**

## 14. Kết luận cuối cùng
**READY FOR PRODUCTION MIGRATION**
Hệ thống hoàn toàn sạch lỗi, dữ liệu cũ được bảo vệ an toàn tuyệt đối và tính năng mới hoạt động chuẩn xác theo nghiệp vụ yêu cầu.
