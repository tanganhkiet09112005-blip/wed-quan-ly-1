# Customer Required Credentials

Danh sách các thông tin, tài khoản và quyền hạn mà Khách hàng (Shop/Merchant/Admin) cần cung cấp để đội ngũ kỹ thuật cấu hình và triển khai hệ thống lên Production.

## 1. Facebook & Meta Fanpage Integration
Để hệ thống tự động bắt đơn từ bình luận Livestream và gửi tin nhắn tự động qua Messenger:

| STT | Tên thông tin / Tài khoản | Mô tả / Cách lấy |
| :--- | :--- | :--- |
| 1 | **Quyền Admin Fanpage** | Quyền quản trị viên trên Fanpage Facebook cần kết nối và bắt đơn. |
| 2 | **Tài khoản Meta Business (BM)** | Tài khoản doanh nghiệp sở hữu Fanpage (nếu có) để phục vụ xác minh ứng dụng. |
| 3 | **Meta App Credentials** | Gồm **App ID** và **App Secret** từ ứng dụng Meta tạo trên trang `developers.facebook.com`. |
| 4 | **Page Access Token (Vĩnh viễn)** | Token truy cập trang đã gia hạn vô thời hạn (Long-lived Page Access Token) để chatbot không bị mất kết nối sau 60 ngày. |
| 5 | **Webhook Verify Token** | Một chuỗi bảo mật ngẫu nhiên tự chọn (ví dụ: `HSHIP_FB_VERIFY_TOKEN_2026`) dùng để xác thực bắt tay giữa Facebook và server của chúng ta. |
| 6 | **Domain HTTPS hợp lệ** | URL trang web vận hành thật đã cài đặt SSL (ví dụ: `https://ship.giasuuviet.com`) để làm webhook endpoint. |
| 7 | **URL Chính sách bảo mật** | Privacy Policy URL và Data Deletion Instructions URL để điền vào phần cấu hình Meta App nhằm xin xét duyệt quyền (App Review). |

## 2. GHN (Giao Hàng Nhanh) Integration
Để tính phí và đẩy đơn trực tiếp sang hệ thống GHN thật:

| STT | Tên thông tin / Tài khoản | Mô tả / Cách lấy |
| :--- | :--- | :--- |
| 1 | **Tài khoản GHN Khách hàng** | Đăng ký tại trang `5sao.ghn.vn` hoặc `khachhang.ghn.vn`. |
| 2 | **API Token** | Lấy tại mục *Cấu hình tài khoản* -> *Mã API Token* trên cổng GHN. |
| 3 | **Shop ID** | Mã cửa hàng GHN (đại diện cho địa chỉ lấy hàng của shop). |
| 4 | **Địa chỉ Kho lấy hàng chính xác** | Địa chỉ chi tiết (Tỉnh/Thành, Quận/Huyện, Phường/Xã) trùng khớp với địa chỉ đăng ký trên hệ thống GHN để tính cước chính xác. |

## 3. GHTK / J&T Express / SPX Integrations
Khi khách hàng có nhu cầu mở rộng kết nối thật với các đơn vị vận chuyển này:

| STT | Nhà vận chuyển | Thông tin cần cung cấp để code Adapter thật |
| :--- | :--- | :--- |
| 1 | **Giao Hàng Tiết Kiệm (GHTK)** | - Token API (lấy từ trang quản trị GHTK).<br>- Tài liệu API mới nhất của GHTK.<br>- URL Endpoint Production thật của GHTK. |
| 2 | **J&T Express** | - Mã khách hàng (Customer Code).<br>- Khóa bảo mật API (API Key / Passphrase).<br>- Tài liệu API J&T (thường cấp qua file PDF cho đối tác doanh nghiệp). |
| 3 | **Shopee Xpress (SPX)** | - Client ID & Client Secret (SPX Open API).<br>- API Token.<br>- Tài liệu đặc tả tích hợp API của SPX. |

> [!WARNING]
> Nếu khách hàng chưa thể cung cấp các Credentials/Tài liệu trên, các kênh vận chuyển tương ứng sẽ chỉ hoạt động ở **Mock Mode** (chế độ giả lập). Khi kích hoạt **Production Mode**, hệ thống sẽ chặn và báo lỗi rõ ràng nếu thiếu thông tin, tránh tạo mã vận đơn ảo gây lỗi vận hành.
