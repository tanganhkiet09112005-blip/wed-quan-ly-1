# Yêu cầu Credentials từ Khách Hàng (Production)

Để hệ thống Hship.vn có thể hoạt động thật 100% (gửi đơn thật cho tài xế, tự động tải đơn từ Shopee, xuất hóa đơn thật), khách hàng cần tự cung cấp các thông tin và keys (credentials) tương ứng.

## 1. Vận Chuyển (Carrier API)
Khách hàng cần liên hệ với bộ phận chăm sóc khách hàng của đơn vị vận chuyển để lấy API Key.

**J&T Express (Open API)**
- `eccompanyid`: Mã đối tác J&T cung cấp.
- `customerid`: Mã khách hàng.
- `key`: Mật khẩu mã hóa / API Secret Key.
- Endpoints (URL) gọi API production thật.
- Khách cần thông báo cho J&T cấu hình Webhook URL của Hship: `https://hship-management.vercel.app/api/webhooks/jt?secret=********`

**GHN / GHTK / SPX**
- `API Token`: Token truy cập hệ thống của hãng vận chuyển.
- `Shop ID`: Mã ID cửa hàng được tạo trên hệ thống hãng.

## 2. Sàn Thương mại điện tử (Open Platform)
Khách hàng cần đăng ký tài khoản Developer trên nền tảng mở của sàn.

**Shopee / Lazada / TikTok**
- `App Key`: Mã ứng dụng.
- `App Secret`: Khóa bí mật.
- `Access Token` & `Refresh Token`: Token ủy quyền gian hàng của khách.
- `Shop ID` (External Shop ID): Mã định danh gian hàng trên sàn.

## 3. Mạng xã hội Facebook (Meta for Developers)
Để tự động nhận bình luận, livestream và tạo đơn nháp:
- Khách phải tạo ứng dụng (App) trên Meta Developer.
- `App ID` & `App Secret`.
- `Page Access Token`: Quyền truy cập quản lý trang Fanpage/Livestream.
- `Verify Token`: Để cấu hình Webhook nhận event bình luận tự động.

## 4. Hóa đơn điện tử (MISA / VNPT)
- Tài khoản kết nối API của MISA SME hoặc VNPT Invoice.
- Cần cấp `App ID`, `API Key`, `Company Code` (Mã số thuế).

## 5. Cấu hình cơ bản của Shop
- Tên Shop/Công ty.
- Số điện thoại.
- Email.
- Địa chỉ kho đầy đủ (Cần chính xác để J&T / GHN qua lấy hàng).
