# Final UAT Checklist (User Acceptance Testing)

Hệ thống Hship.vn đã hoàn thiện phần Core theo yêu cầu. Khách hàng sử dụng danh sách này để nghiệm thu và kiểm tra toàn bộ luồng hoạt động của hệ thống.

## 1. Xác thực & Phân quyền (Login / Auth)
- [ ] Giao diện đăng nhập không còn hiển thị tài khoản demo công khai (Tự động ẩn ở Production).
- [ ] Admin đăng nhập vào trang `Admin Portal`, Customer đăng nhập vào trang `Shop Portal`.

## 2. Admin Portal
- [ ] `Dashboard`: Hiển thị đúng biểu đồ, số liệu, cước phí.
- [ ] `Quản lý Shop`: Liệt kê đúng danh sách cửa hàng trên hệ thống.
- [ ] `Chi tiết Shop (/admin/shops/[id])`: Hiển thị đẩy đủ KPIs, Đơn hàng, Lịch sử, Tích hợp. (Không còn lỗi crash).

## 3. Quản lý Khách hàng (CRM)
- [ ] Truy cập `/customer/clients` thấy danh sách khách hàng của riêng cửa hàng mình.
- [ ] Truy cập `/customer/clients/blacklist` thấy danh sách khách rủi ro/bom hàng. Thêm mới, chỉnh sửa, gỡ bỏ thành công.

## 4. Quản lý Đơn Hàng (Order Management)
- [ ] Tạo đơn thủ công.
- [ ] Đẩy đơn qua Hãng Vận Chuyển (Đặc biệt: Test luồng J&T Open API - Mock/Sandbox/Production).
- [ ] Kiểm tra tính năng tính phí Ship / Cước Carrier tự động.
- [ ] Kiểm tra luồng COD: Thu hộ, Phân tách COD, Báo cáo đối soát.

## 5. Kho & Sản phẩm (Inventory & Products)
- [ ] Tạo mới Sản phẩm, SKU và phân loại.
- [ ] Tự động trừ kho khi có đơn.
- [ ] Trả hàng / Hủy đơn tự động cộng lại kho.

## 6. Sàn TMĐT & Facebook (Guards)
- [ ] Truy cập Sàn TMĐT, Facebook: Hiển thị cảnh báo Sandbox/Mock.
- [ ] Chế độ Mock cho phép `Sync Mock` đơn hàng. 
- [ ] Chế độ Production bị chặn nếu thiếu token, trả thông báo yêu cầu cấp token/app key (Chặn fake sync).

## 7. Hóa Đơn Điện Tử
- [ ] Cho phép in, xem hóa đơn nháp.
- [ ] Ở Production mode, bắt buộc phải có thông tin MISA/VNPT.

## 8. Cấu hình Production (Production Credential Center)
- [ ] Truy cập mục Cài đặt -> `Production Credentials`.
- [ ] Hiển thị đủ các card J&T, Facebook, TMĐT, Hóa đơn và đánh dấu xanh/đỏ (Sẵn sàng/Chưa).
- [ ] Có thể Copy Webhook URL để cung cấp cho J&T.

**Xác nhận UAT đã hoàn thành tất cả các mục trên.**
