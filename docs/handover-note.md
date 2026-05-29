# Bàn giao Hệ thống Hship.vn

**Kính gửi Khách hàng,**

Chúng tôi đã hoàn thiện quá trình phát triển Core hệ thống Hship.vn theo yêu cầu. Dưới đây là ghi chú về tình trạng hiện tại và các bước tiếp theo để đưa hệ thống vào chạy thực tế (Production):

## Tình trạng các Module (Core)
1. **Quản trị (Admin Portal) & Cửa hàng (Shop Portal)**: Đã hoàn thiện chức năng, luồng dữ liệu liên kết đa người dùng (Multi-tenant) độc lập, bảo mật.
2. **Sản phẩm & Tồn kho**: Đã hoàn thiện, tự động trừ kho, hoàn kho theo trạng thái đơn hàng.
3. **Đơn hàng & Giao vận**: Đã hoàn thiện luồng tạo đơn và phân luồng trạng thái chuẩn.
4. **J&T Express API**: Đã tích hợp hoàn chỉnh và ở trạng thái **Production-Ready**. Hệ thống đã hỗ trợ Webhook tự động nhận cập nhật trạng thái đơn từ J&T.

## Trạng thái Chờ Tích Hợp Thêm (Pending Credentials)
Mặc dù hệ thống nội bộ đã 100% hoàn thành, các module liên kết tới các nền tảng bên ngoài hiện đang bật chế độ **Mock / Sandbox Guard** để chặn việc kết nối ảo trên Production.

Để các module này hoạt động thật, Khách hàng vui lòng truy cập **Production Credential Center** (`/customer/settings/production`) để cấu hình.
*Lưu ý, nếu chưa cung cấp API/Key thật, hệ thống sẽ chặn và báo lỗi theo đúng nguyên tắc không fake API.*

1. **Sàn Thương Mại Điện Tử (Shopee/Lazada/TikTok)**: Chờ App Key & Access Token.
2. **Mạng xã hội (Facebook/Fanpage)**: Chờ Page Token & Verify Webhook Token.
3. **Đơn vị vận chuyển khác (GHN/GHTK)**: Chờ API Token.
4. **Hóa đơn điện tử (MISA/VNPT)**: Chờ Credentials/App ID.

**Hãy đọc file `customer-required-credentials.md` để xem danh sách chi tiết các thông tin cần chuẩn bị.**

Trân trọng bàn giao!
Đội ngũ phát triển Hship.
