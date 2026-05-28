# Production Blockers

Tài liệu liệt kê các rào cản kỹ thuật (Blockers) cần giải quyết để hệ thống có thể chuyển sang vận hành thực tế (Production).

## 1. Facebook / Meta Integration Blockers
* **Thiếu HTTPS & Domain đã cấu hình SSL:** Facebook Webhook bắt buộc gọi đến địa chỉ IP hoặc domain dạng `https://` hợp lệ có chứng chỉ SSL. Hiện tại dự án đang chạy ở local (`http://localhost:3000`), không thể nhận Webhook thật trực tiếp từ Meta.
* **Thiếu Meta Developer App & Quyền Truy Cập:**
  * Cần tạo App trên cổng Meta for Developers và liên kết Fanpage của khách hàng.
  * Cần được phê duyệt các quyền nhạy cảm qua **App Review** từ Meta (như `pages_messaging`, `pages_manage_metadata`, `pages_read_user_content`) để chatbot có thể tự động trả lời người dùng ngoài danh sách tester.
* **Mã hóa Token:** Dù đã có cơ chế giải mã, cần đảm bảo `fbAccessToken` khi lưu vào `ShopConfig` hoặc `FacebookPageConnection` phải được mã hóa cẩn thận và không bao giờ log ra console.

## 2. GHN (Giao Hàng Nhanh) Integration Blockers
* **Thiếu Shop ID & Token thật:** Cần tài khoản của chủ shop thật đăng ký trên cổng GHN Khách hàng truyền thống hoặc GHN 5Sao để lấy `ShopId` (API Key) và `Token` (API Token).
* **Địa chỉ kho hàng (Pick Shift):** Để tạo đơn thật trên GHN, thông tin địa chỉ shop gửi (quận/huyện, phường/xã) phải khớp chính xác với danh mục khu vực hành chính thật của GHN (`ProvinceID`, `DistrictID`, `WardCode`). Nếu truyền chuỗi text tự do sẽ bị API GHN từ chối.

## 3. GHTK / J&T Express / SPX Blockers
* **Thiếu Tài liệu API Production & Credentials:** 
  * Hiện tại hệ thống chỉ có adapter Mock.
  * Khách hàng chưa cung cấp API Key, API Token, Client ID hoặc tài liệu tích hợp chính thức cho GHTK, J&T, SPX.
  * **Giải pháp an toàn:** Khi chuyển sang `production` mode, các đơn vị vận chuyển này phải throw lỗi rõ ràng `"API credentials or integration documents missing for this carrier."`, tuyệt đối không tạo tracking code giả lập để tránh sai sót tài chính và vận hành.

## 4. Hệ Thống & Vận Hành (Infrastructure & Database)
* **MySQL/MariaDB Local chưa chạy:** Toàn bộ quá trình kiểm thử runtime DB đang bị gián đoạn vì MySQL server chưa được start tại local. Cần khởi động DB hoặc cấu hình DB Cloud để chạy migration và kiểm tra.
* **Chưa có Hệ thống Log & Monitoring thực tế:**
  * Thiếu công cụ ghi nhận lỗi tập trung (Sentry/Winston) để theo dõi lỗi API carrier hoặc facebook webhook.
  * Cần thiết lập luồng xoay vòng log (log rotation) để tránh đầy ổ đĩa khi nhận lượng webhook lớn từ Facebook và các nhà vận chuyển.
