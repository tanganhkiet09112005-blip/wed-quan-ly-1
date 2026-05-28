# Production Parity Checklist

Bảng đối chiếu chi tiết hiện trạng các tính năng giữa môi trường Thử nghiệm (Mock/Staging) và Thực tế (Production).

| Module | Chức năng | Hiện trạng | Cần làm để vận hành thật | File/Module liên quan | Ưu tiên |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Quản trị (Admin)** | Tạo/sửa/khóa tài khoản shop | **Done** | Giữ nguyên logic quản lý đa shop (multi-tenant) qua phân quyền Admin Portal. | `app/admin/shops/*`, `/api/shops` | Cao |
| **Quản trị (Admin)** | Tổng hợp số liệu: đơn, cước, COD | **Done** | Tính toán tổng hợp thời gian thực từ DB, loại trừ các đơn hủy/trả khỏi COD collected. | `app/api/dashboard/route.js`, `/api/reports/cod` | Cao |
| **Quản trị (Admin)** | Audit Log hành động nhạy cảm | **Missing** | Thiết kế bảng `AuditLog` và ghi lại hoạt động đăng nhập, đổi credentials, thay đổi đơn hàng... | `prisma/schema.prisma`, `lib/server/audit.js` | Cao |
| **Shop Portal** | Cấu hình Carrier (ĐVVC) | **Partial** | Thêm trường `mode` (mock/sandbox/production), hiển thị trạng thái kết nối và thêm nút "Test connection". | `app/customer/partners/shippers/*`, `prisma/schema.prisma` | Rất Cao |
| **Shop Portal** | Đẩy đơn hàng qua Carrier thật | **Mock** | Đẩy đơn qua API thật của GHN (khi mode=production), throw lỗi rõ cho GHTK, J&T, SPX nếu thiếu API docs. | `lib/carriers/*`, `app/api/orders/[id]/push` | Rất Cao |
| **Shop Portal** | Theo dõi vận đơn (Tracking) | **Mock** | Fetch trạng thái thực từ GHN API theo định kỳ hoặc qua webhook, cập nhật trạng thái đơn tương ứng. | `lib/carriers/ghn.js`, `/api/webhooks/ghn` | Cao |
| **Shop Portal** | Quản lý COD và Ledger | **Partial** | Đối soát COD tự động, chuyển trạng thái từ `delivered` -> `collected` khi có webhook đối soát hoặc cập nhật thủ công. | `/api/reports/cod`, `prisma/schema.prisma` | Cao |
| **Facebook & Bot** | Kết nối Fanpage/Livestream | **Mock** | Lưu Page Access Token (mã hóa), Verify Token/App Secret cấu hình qua biến môi trường. | `prisma/schema.prisma`, `app/api/facebook/*` | Rất Cao |
| **Facebook & Bot** | Nhận & Normalize Facebook Webhook | **Mock** | Tạo endpoint `/api/facebook/webhook` nhận event thật từ Meta API, normalize sang ChatSession. | `/api/facebook/webhook` | Rất Cao |
| **Facebook & Bot** | Chatbot hỏi thông tin & Tạo nháp | **Mock** | Sử dụng Parser Regex rule-based để bóc tách SĐT, địa chỉ, size, số lượng. Tạo đơn draft chờ shop xác nhận. | `lib/chatbot/parser.js`, `/api/facebook/webhook` | Cao |
| **Bảo mật (Security)**| Xác thực Server-side & Multi-tenant | **Done** | Đảm bảo 100% API lọc theo `shopId` từ Session, không tin cậy `shopId` truyền lên từ client. | `lib/server/auth.js` | Rất Cao |
| **Bảo mật (Security)**| Mã hóa Token & Credentials | **Done** | Mã hóa 2 chiều toàn bộ apiKey/apiToken/fbAccessToken trước khi lưu DB bằng AES-256-GCM. | `lib/server/secrets.js` | Rất Cao |
| **Bảo mật (Security)**| Rate Limit & Ẩn Stack Trace | **Partial** | Giới hạn tần suất gọi Webhook & Auth API. Định dạng chuẩn hóa lỗi API, không để lộ stack trace. | `lib/server/responses.js` | Cao |
