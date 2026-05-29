# Kịch bản Nghiệm thu Hệ thống (UAT)

> Dành cho khách hàng kiểm thử các chức năng của hệ thống trước khi vận hành thực tế.

| Module | Hành động Test | Trạng thái Pass/Fail |
|---|---|---|
| **Đăng nhập** | Truy cập `/login`. Giao diện không hiện tài khoản demo. Khách đăng nhập bằng tài khoản được bàn giao thành công. | [ ] |
| **Sidebar & Layout** | Admin thấy Sidebar tổng (Quản trị Shop), Customer thấy Sidebar bán hàng. Click các menu không bị báo lỗi trang 404 (Not Found). | [ ] |
| **Dashboard** | Hiện thông tin tổng quan, số lượng đơn hàng, doanh thu. Biểu đồ hiển thị dữ liệu (hoặc báo rỗng nếu chưa có đơn). | [ ] |
| **Quản lý Khách hàng** | Vào `Khách hàng`. Tạo mới, sửa tên và số điện thoại khách. Thông tin được cập nhật. | [ ] |
| **Blacklist** | Vào `Khách bom hàng`. Thêm SĐT bất kỳ kèm lý do. Hệ thống phải cảnh báo chữ đỏ. Nhấn Xóa để gỡ khách ra khỏi danh sách. | [ ] |
| **Tồn kho** | Thêm mới một sản phẩm với số lượng kho là 10. Tạo thử một đơn hàng chứa sản phẩm đó. Kho tự động giảm xuống 9. Hủy đơn hàng, kho tăng lại lên 10. | [ ] |
| **Giao vận** | Vào màn hình Đơn hàng. Chọn một đơn chưa đẩy hãng vận chuyển. Click `Đẩy sang hãng vận chuyển`, hệ thống báo thành công hoặc in ra thông báo lỗi yêu cầu từ hãng. | [ ] |
| **Cấu hình API** | Vào mục `Cài đặt` -> `Production Credentials`. Cảnh báo vàng sẽ hiển thị nếu bạn chưa nhập Key. | [ ] |
| **Kiểm tra Guard** | Cố tình không nhập Access Token của Shopee, vào tab Thương mại điện tử ấn "Sync Mock" (hoặc "Đồng bộ thật"). Hệ thống phải hiện hộp thoại từ chối và yêu cầu nhập Key thật. | [ ] |
| **Hóa đơn điện tử** | Cố tình tạo hóa đơn khi chưa nhập API Key MISA. Hệ thống sẽ chặn ở Production. Chỉ cho phép dùng giả lập nếu mode = Mock. | [ ] |

**Yêu cầu:** Khách hàng đánh dấu [x] vào các ô trên sau khi kiểm thử và ký nhận nghiệm thu hệ thống.
