# Checklist Vận Hành Hằng Ngày & Đảm Bảo Bảo Mật

> Dành cho Admin / Quản lý cửa hàng

## 1. Vận hành Đầu Ngày
- [ ] Truy cập `Dashboard` kiểm tra các đơn hàng mới phát sinh từ hôm qua.
- [ ] Kiểm tra mục `Production Credentials` đảm bảo tất cả Module Sàn TMĐT và Facebook đang ở trạng thái Xanh (Token chưa hết hạn).
- [ ] Nếu thấy cảnh báo vàng "Missing Credentials", lập tức kiểm tra và cấp lại quyền cho Ứng dụng Sàn/Facebook để tránh rớt đơn.
- [ ] Xử lý các đơn báo lỗi vận chuyển ở tab `Đơn hàng -> Vận chuyển`.

## 2. Vận hành Cuối Ngày
- [ ] Kiểm tra toàn bộ đơn đã đẩy sang hãng J&T/GHN xem hãng đã "Lấy hàng thành công" chưa. Nếu có đơn kẹt, liên hệ bưu cục.
- [ ] Truy cập Báo cáo COD, tải file đối soát để khớp tiền về tài khoản ngân hàng.
- [ ] Đảm bảo không còn đơn rác (Fake/Mock) chạy lẫn lộn vào báo cáo thật.

## 3. Quản lý Nhân sự & Bảo Mật
- [ ] Hàng tuần: Kiểm tra danh sách nhân viên được cấp tài khoản vào Hship.
- [ ] Nhân viên nghỉ việc: Khóa tài khoản (`/admin/shops`) ngay lập tức để tránh lộ thông tin khách hàng và số liệu nội bộ.
- [ ] Định kỳ 3-6 tháng đổi mật khẩu các API Key / App Secret ở các sàn nếu có nghi ngờ lộ lọt thông tin.
- [ ] **Lưu ý Vàng:** Đừng gửi file chứa API Key (như `key.txt` hay `.env`) cho bất kỳ ai qua Messenger/Zalo mà không nén bằng mật khẩu. Mất API Key tương đương với việc người khác có thể tự lấy hết dữ liệu đơn hàng và khách hàng của bạn.

## 4. Xử lý khi có lỗi phần mềm
- **Khách không login được:** Thử F5, kiểm tra Wifi.
- **Tính năng báo lỗi 500:** Chụp toàn bộ màn hình, hiển thị rõ địa chỉ URL và thời gian xảy ra, gửi cho bộ phận Kỹ thuật. Không bấm F5 liên tục nhiều lần.
- **Mất liên kết với máy in Hóa đơn MISA:** Khởi động lại tool kết nối MISA trên máy tính local.
