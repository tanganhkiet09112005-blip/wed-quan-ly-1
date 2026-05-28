# Go-Live Requirements & Blockers
> Những hạng mục bắt buộc phải có để chuyển trạng thái từ Sandbox sang Production.

Hệ thống hiện tại đã hoàn thiện về mặt tính năng (Feature Complete) và Giao diện (UI Parity). Tuy nhiên, một số kết nối bên thứ 3 đang chạy trên môi trường giả lập (Mock/Sandbox). Để bàn giao dự án chạy thực tế (Go-live), khách hàng cần cung cấp các thông tin sau:

## 1. Meta / Facebook (Omnichannel & Chatbot)
Hệ thống hiện tại đang mock logic bóc tách bình luận. Để webhook nhận bình luận thật từ Fanpage:
- **Meta App ID** & **App Secret**: Cần tạo 1 App trên Meta for Developers.
- **Page Access Token**: Token có quyền `pages_messaging`, `pages_read_engagement`, `pages_manage_metadata`.
- **Verify Webhook**: Khách hàng cần trỏ Meta Webhook URL về endpoint `/api/webhooks/pancake` của server production, cung cấp `VERIFY_TOKEN`.

## 2. Đơn vị vận chuyển (Carriers)
Hệ thống đã xây dựng sẵn logic mã hóa và cấu hình, nhưng cần API Credentials thật của shop để test luồng Đẩy đơn & Cập nhật trạng thái (Webhook):
- **GHN**: Token + Shop ID (Production)
- **GHTK**: Token (Production)
- **J&T Express**: Cần Partner ID + API Key do J&T cấp riêng cho đối tác.
- **Shopee Xpress**: Cần API Key.

## 3. Sàn Thương Mại Điện Tử (Ecommerce)
Hệ thống đang chạy Mock Sync. Để tự động đồng bộ đơn thật:
- **Shopee Open Platform**: Cần Partner ID, Partner Key, và URL redirect để shop thực hiện luồng OAuth Authorization.
- **Lazada / TikTok Shop**: Cần API Key & Secret tương tự, đăng ký tài khoản Developer trên nền tảng của họ.

## 4. Hóa Đơn Điện Tử (E-Invoice)
Hệ thống đang mock phát hành Sandbox. Để xuất hóa đơn thật (có giá trị pháp lý):
- Khách hàng đã ký hợp đồng với NCC Hóa Đơn (MISA, VNPT, Viettel...).
- Cung cấp API Key / Mã số thuế / Tên đăng nhập hệ thống HĐĐT.
- (Hiện tại code đã cấu trúc sẵn hook `pushInvoiceToMisa`, chỉ cần điền body chuẩn của MISA).

## 5. Hạ tầng máy chủ (Infrastructure)
- **Database**: Cần 1 MySQL/MariaDB Server phiên bản >= 8.0. (Khuyến nghị: AWS RDS hoặc DigitalOcean Managed DB).
- **Server**: Cần VPS/Server để deploy Next.js (Node.js >= 18).
- **Domain & SSL**: Tên miền chính thức và chứng chỉ SSL (HTTPS bắt buộc cho Facebook Webhook và Service Worker).
- **Environment Variables**: Phải thiết lập `ENCRYPTION_KEY` (chuỗi bảo mật 32 bytes) cố định để không làm mất token vận chuyển/facebook đã lưu của shop.
