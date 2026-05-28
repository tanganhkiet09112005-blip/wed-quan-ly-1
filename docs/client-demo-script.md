# Kịch bản Demo Sản Phẩm Hship.vn
> Dành cho buổi nghiệm thu bàn giao (UAT)

## 1. Chuẩn bị trước demo
- Chạy lệnh reset data: `node prisma/seed.js`
- Đảm bảo app đang chạy ở `http://localhost:3000`
- Chuẩn bị 2 tab trình duyệt (1 tab Admin, 1 tab Shop)

## 2. Các flow chính cần demo

### Phân đoạn 1: Admin & Tổng quan hệ thống
1. **Login Admin:** Vào `/login` nhập `admin@hship.vn / admin123`
2. **Dashboard Admin:** Giới thiệu cái nhìn tổng quan toàn hệ thống (tổng shop, tổng đơn, KPI chung).
3. **Quản lý Shop:** Chuyển sang `/admin/shops`, chỉ ra các shop hiện có.
4. **Tạo Shop mới:** Click Tạo shop, nhập thông tin, nhấn lưu. Chứng minh hệ thống multi-tenant tạo phân vùng dữ liệu riêng ngay lập tức.

### Phân đoạn 2: Quản lý cửa hàng cốt lõi (Core Shop)
1. **Login Shop:** Chuyển tab, đăng nhập `genz@hship.vn / shop123`
2. **Dashboard Shop:** Giới thiệu KPI bán hàng, biểu đồ doanh thu của riêng shop GenZ.
3. **Danh mục sản phẩm & Kho:** Vào `/customer/products` và `/customer/inventory`. Giới thiệu việc quản lý sản phẩm có nhiều biến thể (SKU) và cơ chế báo hiệu sắp hết hàng (Low Stock).
4. **Tạo đơn hàng thủ công:** Vào `/customer/orders/create`.
   - Tìm khách hàng cũ, hệ thống tự điền thông tin.
   - Chọn sản phẩm (SKU) vào đơn.
   - Xác nhận lưu thành Đơn Nháp.
5. **Quản lý đơn hàng:** Vào `/customer/orders/manage`.
   - Tìm kiếm đơn, dùng bộ lọc trạng thái.
   - Click vào đơn nháp vừa tạo, chuyển trạng thái "Xác nhận". Nhấn mạnh việc **tồn kho tự động bị trừ**.

### Phân đoạn 3: Đa kênh & Chatbot (Omnichannel)
1. **Chatbot Fanpage/Livestream:** Vào `/customer/channels/livestream`.
   - Giới thiệu giao diện chia 3 cột (Danh sách - Chat - Thông tin chốt đơn) giống hệt các phần mềm lớn như UPOS/Pancake.
   - Dùng tính năng **"Mock Comment"**, giả lập khách hàng bình luận: `"Cho mình chốt cái áo sơ mi size M sdt 0988777666 nha địa chỉ 123 Lê Lợi"`
   - Chỉ ra việc Bot tự động quét và bóc tách thông tin (SĐT, Địa chỉ, Sản phẩm, Size) vào cột bên phải.
   - Bấm **"Tạo đơn nháp"** ngay từ khung chat.

2. **Bán tại quầy (POS):** Vào `/customer/channels/pos`.
   - Chọn nhanh sản phẩm từ màn hình POS.
   - Điền tiền khách đưa, tính tiền thối.
   - Bấm **Thanh toán & In hóa đơn**. Chỉ ra trình duyệt hiện form in Bill nhỏ. (Tồn kho cũng tự động trừ).

3. **Sàn TMĐT (Ecommerce):** Vào `/customer/channels/ecommerce`.
   - Giới thiệu nơi cấu hình Shopee, Tiktok.
   - Dùng tính năng **Đồng bộ Đơn giả lập (Mock Sync)** để kéo đơn từ Sàn về.
   - Vào mục Quản lý đơn, chỉ ra các đơn vừa kéo về có logo Shopee.

### Phân đoạn 4: Vận chuyển, COD & Hóa Đơn
1. **Cấu hình ĐVVC:** Vào `/customer/partners/shippers`.
   - Mở card GHN, nhập token giả, lưu lại. Nhấn mạnh việc bảo mật (Token hiển thị dạng `****`).
2. **Đẩy đơn & Theo dõi:** Vào chi tiết 1 đơn hàng Pending.
   - Chọn "Đẩy qua GHN".
   - Dùng công cụ "Mock Status" mô phỏng ĐVVC cập nhật trạng thái "Đang giao" -> "Giao thành công".
3. **Báo cáo COD:** Vào `/customer/reports/cod`.
   - Chỉ ra đơn vừa "Giao thành công" đã được cộng vào "COD đã thu".
   - Demo việc xuất file CSV để đối soát.
4. **Hóa đơn điện tử:** Vào `/customer/invoices`.
   - Chỉ ra hệ thống đã tự động gom các đơn hàng giao thành công thành hóa đơn nháp/chính thức.
   - Mở 1 hóa đơn nháp, bấm **Phát hành (Sandbox)**.
   - Bấm **In hóa đơn** để xem form in A4 tiêu chuẩn.

## 3. Tổng kết
- Hệ thống đáp ứng đầy đủ yêu cầu nghiệp vụ của 1 shop (bán lẻ + online + sàn).
- UI/UX parity với web mẫu, chuyên nghiệp, responsive.
- Bảo mật multi-tenant 100%. Mọi thứ đã sẵn sàng để đấu nối API Production thật để Go-live.
