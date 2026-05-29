# Hướng dẫn Thiết lập API Key & Credential (Môi trường thật)

Khi chạy thực tế, phần mềm Hship cần được "ủy quyền" bởi các đối tác bên thứ ba thông qua các API Key. Không có các Key này, phần mềm chỉ có thể ghi nhận dữ liệu offline chứ không thể kết nối gửi đơn.

## Các loại Key bắt buộc phải cung cấp

### 1. J&T Express (Vận chuyển)
Bạn cần ký hợp đồng với J&T và yêu cầu họ cấp tài khoản kết nối Open API.
- **eccompanyid**: Mã số đối tác (VD: HSHIPVN).
- **customerid**: ID khách hàng định danh.
- **key**: Khóa mã hóa bảo mật dữ liệu (`data_digest`).
- **Webhook URL**: Bạn lấy đường link Webhook từ tab "Production Credential" trên hệ thống Hship (Ví dụ: `https://hship.vn/api/webhooks/jt?secret=xxx`) và gửi cho bộ phận IT của J&T. Việc này giúp Hship tự động biết đơn hàng đã giao thành công mà không cần bạn phải tự tra cứu mã vận đơn.

### 2. Shopee / Lazada / TikTok Shop (Sàn TMĐT)
- Bạn vào **Open Platform** của từng sàn. Tạo 1 ứng dụng (App).
- Bạn sẽ nhận được `App Key` và `App Secret`.
- Sau đó, bạn dùng App này đăng nhập vào gian hàng Shopee/TikTok của mình để thực hiện việc "Ủy quyền" (Authorize). Quá trình này sẽ sinh ra `Access Token` và `Refresh Token`.
- Dán Token này vào Cài đặt Sàn trên Hship để Hship có quyền kéo đơn hàng về.
- **Lưu ý:** Token thường có thời hạn (ví dụ 30 ngày hoặc 1 năm). Hãy ghi nhớ thời gian để gia hạn.

### 3. Facebook Fanpage (Mạng xã hội)
- Đăng nhập [Meta for Developers](https://developers.facebook.com/).
- Tạo ứng dụng -> Thêm sản phẩm Facebook Login & Messenger.
- Tạo `Page Access Token` cho Fanpage của bạn.
- Vào Hship, lấy `Verify Token` dán ngược vào Meta App để Facebook hiểu rằng Hship là phần mềm nhận tin nhắn của bạn.
- Bật cờ (Subscribe) sự kiện `messages` và `feed` (để nhận bình luận livestream).

### 4. MISA SME / VNPT Invoice (Hóa đơn)
- Hệ thống hóa đơn của Thuế yêu cầu mã hóa rất bảo mật. Bạn cần làm việc với nhà cung cấp phần mềm kế toán của bạn để xin tài liệu tích hợp API.
- Cấp `API Key`, Mã số thuế và dán vào tab Hóa đơn điện tử.

> Nếu bất kỳ thông số nào chưa được nhập, tính năng Production Guard của Hship sẽ chủ động chặn các nút bấm "Tạo đơn", "Đẩy đơn", "Xuất hóa đơn" để bảo vệ an toàn cho hệ thống dữ liệu của bạn, đồng thời xuất hiện cảnh báo yêu cầu bạn hoàn thiện cấu hình.
