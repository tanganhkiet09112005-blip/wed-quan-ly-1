# Hướng Dẫn Sử Dụng Và Bàn Giao Hệ Thống Hship/Uship

- **Phiên bản:** Production Ready
- **Đối tượng sử dụng:** Khách hàng, Admin tổng, Admin con, Shop, Kỹ thuật
- **Ngày cập nhật:** 2026-05-30
- **Ghi chú:** Tài liệu dùng cho vận hành app thật, UAT, bảng giá theo shop, thông luồng đơn hàng và backup/restore

---

## Mục lục
1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Phân quyền người dùng](#2-phân-quyền-người-dùng)
3. [Hướng dẫn Admin tổng tạo Admin con](#3-hướng-dẫn-admin-tổng-tạo-admin-con)
4. [Hướng dẫn quản lý shop](#4-hướng-dẫn-quản-lý-shop)
5. [Hướng dẫn cấu hình bảng giá riêng theo shop](#5-hướng-dẫn-cấu-hình-bảng-giá-riêng-theo-shop)
6. [Hướng dẫn Shop lên đơn và tự tính cước](#6-hướng-dẫn-shop-lên-đơn-và-tự-tính-cước)
7. [Hướng dẫn thông luồng / phân luồng đơn hàng](#7-hướng-dẫn-thông-luồng--phân-luồng-đơn-hàng)
8. [Hướng dẫn cấu hình rule thông luồng](#8-hướng-dẫn-cấu-hình-rule-thông-luồng)
9. [Hướng dẫn Admin duyệt đơn / đẩy vận chuyển](#9-hướng-dẫn-admin-duyệt-đơn--đẩy-vận-chuyển)
10. [Hướng dẫn Shop xem trạng thái đơn](#10-hướng-dẫn-shop-xem-trạng-thái-đơn)
11. [Quản lý đơn hàng (Uship Layout) và Đối soát](#11-quản-lý-đơn-hàng-uship-layout-và-đối-soát)
12. [Production Credential Center](#12-production-credential-center)
13. [CRM khách hàng và Blacklist](#13-crm-khách-hàng-và-blacklist)
14. [Dashboard / Báo cáo](#14-dashboard--báo-cáo)
15. [Checklist UAT cho khách](#15-checklist-uat-cho-khách)
16. [Lỗi thường gặp và cách xử lý](#16-lỗi-thường-gặp-và-cách-xử-lý)
17. [Backup / Restore / Vận hành](#17-backup--restore--vận-hành)
18. [Bảo mật](#18-bảo-mật)
19. [Tóm tắt kiểm tra production](#19-tóm-tắt-kiểm-tra-production)

---

## 1. Tổng quan hệ thống
Hệ thống Hship/Uship hỗ trợ nền tảng vận chuyển đa cấp độ với các tính năng:
- **Admin tổng / Admin con / Shop:** Phân quyền quản trị và sử dụng chặt chẽ.
- **Quản lý shop:** Theo dõi, tạo mới, và kiểm soát cửa hàng đại lý.
- **Bảng giá riêng theo từng shop:** Tùy biến mức giá cước linh hoạt theo từng mốc cân.
- **Shop lên đơn tự tính cước:** Chống gian lận bằng cách áp dụng cứng giá cước theo bảng giá.
- **Thông luồng đơn hàng (Order Routing):** Quản lý trạng thái và tự động hóa quy trình đẩy sang đối tác vận chuyển.
- **Dashboard, báo cáo, quản lý đơn:** Thống kê lợi nhuận, doanh thu, đơn hàng theo thời gian thực.

---

## 2. Phân quyền người dùng

### Admin tổng
- Tạo Admin con.
- Xem toàn bộ shop.
- Gán shop cho Admin con.
- Cấu hình bảng giá mọi shop.
- Cấu hình thông luồng mọi shop.
- Duyệt đơn và đẩy vận chuyển.
- Xem báo cáo tổng.

### Admin con
- Chỉ thấy shop thuộc quyền.
- Tạo shop thuộc quyền.
- Cấu hình bảng giá shop thuộc quyền.
- Cấu hình thông luồng shop thuộc quyền.
- Duyệt/đẩy đơn thuộc shop mình quản lý.
- Không thấy shop của Admin khác.
- Không tạo được Admin tổng.

### Shop
- Đăng nhập tạo đơn.
- Chỉ thấy dữ liệu shop mình.
- Lên đơn và hệ thống tự tính cước.
- Xem trạng thái đơn.
- Không có quyền cấu hình bảng giá hay thông luồng.
- Không có quyền duyệt/đẩy đơn nếu không được cấp phép.

---

## 3. Hướng dẫn Admin tổng tạo Admin con
Các bước thực hiện:
1. Đăng nhập Admin tổng.
2. Vào **Quản lý Admin con** ở menu bên trái.
3. Bấm nút **Thêm Admin**.
4. Nhập đầy đủ **Tên, Email/Username, Mật khẩu, Trạng thái**.
5. Bấm **Lưu** tài khoản.
6. Kiểm tra lại xem Admin con đã xuất hiện trong danh sách chưa.

---

## 4. Hướng dẫn quản lý shop
Hệ thống quản lý theo quy định sau:
- **Admin tổng** có thể xem tất cả các shop.
- **Admin con** chỉ xem được shop thuộc quyền mình.
- Admin tổng khi **Tạo shop mới** có thể gán shop đó cho bất kỳ Admin con nào thông qua dropdown.
- Ý nghĩa cột **Admin quản lý**: Chỉ ra ai đang phụ trách shop này. Nếu shop chưa gán Admin con, hệ thống sẽ tự hiểu là "Admin tổng" hoặc "Chưa gán".

---

## 5. Hướng dẫn cấu hình bảng giá riêng theo shop
Mỗi shop có thể có bảng giá riêng theo mốc cân.

**Ví dụ:**
- **Shop A:** 0–5kg = 22.000đ
- **Shop B:** 0–5kg = 30.000đ
- Khi Shop A lên đơn 5kg → hệ thống hiển thị **22.000đ**.
- Khi Shop B lên đơn 5kg → hệ thống hiển thị **30.000đ**.

**Các bước cấu hình:**
1. Admin vào **Quản lý shop**.
2. Chọn shop cần cấu hình.
3. Bấm nút **Bảng giá** (Icon hình bánh răng).
4. Bấm **Thêm mốc cân**.
5. Nhập **Từ kg, Đến kg, Giá cước, Ghi chú**.
6. Bấm **Lưu**.

**Quy tắc bắt buộc:**
- Từ kg phải nhỏ hơn Đến kg.
- Giá cước phải lớn hơn 0.
- Không được tạo mốc cân chồng nhau (Overlap).
- Đổi bảng giá hiện tại sẽ **không** làm thay đổi cước phí của các đơn cũ đã tạo trước đó.

---

## 6. Hướng dẫn Shop lên đơn và tự tính cước
**Các bước:**
1. Shop đăng nhập tài khoản.
2. Vào phần **Tạo đơn**.
3. Nhập đầy đủ thông tin người nhận hàng.
4. Nhập **trọng lượng** gói hàng.
5. Hệ thống tự quét lấy bảng giá của shop đang đăng nhập và **tự điền phí vận chuyển**.
6. Shop kiểm tra thông tin và tạo đơn.

> [!IMPORTANT] Lưu ý
> - Phí được lưu snapshot vào đơn tại thời điểm tạo, an toàn không bị lệch báo cáo.
> - Shop **không tự sửa phí** nếu phí đã được lấy từ bảng giá (Input bị khoá).
> - Nếu Shop chưa có bảng giá sẽ thấy cảnh báo: *"Shop chưa được cấu hình bảng giá cước. Vui lòng liên hệ Admin."* và không cho tiếp tục.

---

## 7. Hướng dẫn thông luồng / phân luồng đơn hàng
Thông luồng là cơ chế hệ thống tự xác định trạng thái xử lý đơn.

| Trạng thái | Ý nghĩa | Ai xử lý |
|---|---|---|
| `READY_TO_PUSH` | Đơn đủ điều kiện đẩy vận chuyển | Admin |
| `WAITING_APPROVAL` | Đơn vướng rule, cần Admin duyệt | Admin |
| `MANUAL_PROCESSING` | Đơn đặc biệt cần xử lý thủ công | Admin |
| `MISSING_CREDENTIALS` | Shop thiếu API vận chuyển | Admin/Kỹ thuật |
| `PRICING_MISSING` | Shop thiếu bảng giá/mốc cân | Admin |
| `BLOCKED` | Đơn bị chặn theo rule hoặc blacklist | Admin |
| `PUSHED_TO_CARRIER` | Đơn đã đẩy vận chuyển thành công | Theo dõi |
| `PUSH_FAILED` | Đẩy vận chuyển sang Hãng bị thất bại | Admin/Kỹ thuật |

---

## 8. Hướng dẫn cấu hình rule thông luồng
**Các bước:**
1. Vào trang chi tiết Shop.
2. Vào phần **Thông luồng / Flow Rules**.
3. Bấm Thêm rule.
4. Chọn loại điều kiện (Giá trị COD, Trọng lượng...).
5. Nhập giá trị đối chiếu.
6. Chọn hành động (Waiting Approval, Blocked...).
7. Lưu rule.

**Ví dụ thực tế:**
- Nếu `COD > 5.000.000đ` → Hệ thống tự gắn mác `WAITING_APPROVAL`.
- Nếu `Trọng lượng > 20kg` → Gắn mác `MANUAL_PROCESSING`.
- Nếu Khách nằm trong `Blacklist` → Gắn mác `BLOCKED` hoặc `WAITING_APPROVAL`.

---

## 9. Hướng dẫn Admin duyệt đơn / đẩy vận chuyển
1. Vào **Quản lý đơn hàng** bên phía Admin.
2. Xem badge trạng thái luồng.
3. Nếu đơn là `WAITING_APPROVAL` → bấm **Duyệt**.
4. Nếu đơn là `READY_TO_PUSH` → bấm **Đẩy vận chuyển**.
5. Nếu đơn là `PUSH_FAILED` → bấm **Thử lại** để gọi lại API.
6. Shop hoàn toàn không có quyền thao tác các nút quản trị này.

---

## 10. Hướng dẫn Shop xem trạng thái đơn
1. Shop vào danh sách đơn hàng.
2. Xem cột trạng thái đơn.
3. Giải thích một số thông báo từ hệ thống:
   - *Tạo đơn thành công, đang chờ Admin duyệt*
   - *Đơn đã được ghi nhận, đang chờ cấu hình vận chuyển*
   - *Shop chưa được cấu hình bảng giá cước*
   - *Đơn đủ điều kiện xử lý*

---

## 11. Quản lý đơn hàng (Uship Layout) và Đối soát

Màn hình **Danh sách đơn hàng** (Dành cho Admin và Shop) được thiết kế hiện đại, cung cấp khả năng lọc và đối soát chuyên sâu.

### Các tính năng chính:
- **Nội dung hàng hoá**: Khi tạo đơn, Shop có thể nhập Nội dung hàng hóa (Ví dụ: Áo thun, mỹ phẩm...). Thông tin này hiển thị rõ ràng trên cột "Nội dung hàng hoá".
- **Lọc Đối soát**: Hệ thống có menu dropdown Đối soát để lọc:
  - `Chờ đối soát`: Lọc ra các đơn hàng chưa đối soát.
  - `Đã đối soát`: Lọc ra các đơn hàng đã đối soát xong.
  - Chọn cả hai hoặc không chọn gì sẽ hiển thị toàn bộ đơn.
- **Lọc Nâng cao**: 
  - Trạng thái đơn (Đơn nháp, Đang giao, Đã giao, Hoàn hàng...)
  - Trạng thái COD (Đang thu, Đã thu, Đã đối soát...)
  - Đơn vị vận chuyển (GHN, SPX, J&T...)
  - Lọc theo ngày.
- **Thẻ Thống kê (Summary Cards)**: Hệ thống tự động tính tổng Số lượng đơn, Tổng giá trị đơn hàng, Tổng tiền thu hộ (COD) và Tổng phí dịch vụ giao hàng **Dựa trên dữ liệu đang được lọc**.
- **Xuất Excel**: Cho phép tải xuống file `.csv` danh sách đơn hàng dựa trên các bộ lọc hiện tại, hỗ trợ đầy đủ các trường nội dung hàng hóa và đối soát.

### Quyền hạn Đối soát:
- Chỉ **Admin tổng** và **Admin con** (quản lý shop đó) mới có thể chọn các đơn hàng và bấm "Đánh dấu đã đối soát".
- **Shop** chỉ có quyền xem trạng thái, không thể tự đối soát đơn hàng.

---

## 12. Production Credential Center
- **Khái niệm:** API key/credential là thông tin kết nối thật với đơn vị vận chuyển/nền tảng bên thứ ba (GHTK, GHN, J&T).
- Nếu thiếu thông tin này, hệ thống sẽ báo `MISSING_CREDENTIALS`.
- **Lưu ý:** Đây **không phải lỗi phần mềm**. Khi nhập đủ API key thật, hệ thống mới có thể đẩy vận chuyển thật (Không fake success).

---

## 12. CRM khách hàng và Blacklist
- Khách hàng nếu bị đưa vào danh sách **Blacklist** có thể làm đơn hàng tiếp theo của họ bị đánh dấu `BLOCKED` hoặc `WAITING_APPROVAL`.
- Admin cần vào xem xét lịch sử mua hàng trước khi quyết định xử lý.
- Shop không thể tự tiện bỏ blacklist nếu không được Admin cấp quyền.

---

## 13. Dashboard / Báo cáo
- **Dashboard** sẽ thống kê số liệu real-time từ đơn hàng thật.
- Tổng phí vận chuyển lợi nhuận được hệ thống tính tự động từ cột `Order.shippingFee` (được snapshot tại thời điểm đơn được tạo).
- **Việc thay đổi bảng giá sẽ không bao giờ làm đổi phí các đơn cũ**. Do đó, báo cáo lợi nhuận cũng sẽ không tự tính lại các đơn cũ theo bảng giá mới.

---

## 14. Checklist UAT cho khách

### Admin tổng / Admin con
- [ ] Admin tổng đăng nhập được.
- [ ] Admin tổng thấy menu Quản lý Admin con.
- [ ] Admin tổng tạo Admin con được.
- [ ] Admin con đăng nhập được.
- [ ] Admin con không thấy menu Quản lý Admin con.
- [ ] Admin con chỉ thấy shop thuộc quyền.

### Bảng giá theo shop
- [ ] Shop A 0–5kg = 22.000đ.
- [ ] Shop B 0–5kg = 30.000đ.
- [ ] Shop A lên đơn 5kg hiện 22.000đ.
- [ ] Shop B lên đơn 5kg hiện 30.000đ.
- [ ] Mốc cân overlap bị chặn.
- [ ] Giá <= 0 bị chặn.

### Thông luồng
- [ ] Shop đủ cấu hình tạo đơn ra `READY_TO_PUSH`.
- [ ] Thiếu bảng giá ra `PRICING_MISSING`.
- [ ] Thiếu API vận chuyển ra `MISSING_CREDENTIALS`.
- [ ] COD vượt ngưỡng quy định ra `WAITING_APPROVAL`.
- [ ] Admin duyệt đơn thành công sang `READY_TO_PUSH`.
- [ ] Shop chỉ xem trạng thái, không có quyền duyệt đơn.

### Regression
- [ ] Dashboard load thành công.
- [ ] Danh sách đơn hàng load ổn định.
- [ ] Màn Báo cáo lợi nhuận lấy đúng số.
- [ ] Đơn cũ vẫn giữ mức phí vận chuyển cũ.
- [ ] Toàn bộ trang web không hiển thị lỗi `undefined`, `null` hoặc `[object Object]`.

---

## 15. Lỗi thường gặp và cách xử lý

| Tình huống | Nguyên nhân | Cách xử lý |
|---|---|---|
| Shop lên đơn không có cước | Chưa cấu hình bảng giá | Admin thêm bảng giá cho shop |
| PRICING_MISSING | Thiếu bảng giá hoặc thiếu mốc cân | Cập nhật thêm mốc cân |
| MISSING_CREDENTIALS | Thiếu API vận chuyển | Cấu hình API key của hãng |
| WAITING_APPROVAL | Đơn cần Admin duyệt theo Flow Rule | Admin vào duyệt đơn |
| PUSH_FAILED | Đẩy vận chuyển lỗi do server Hãng | Kiểm tra mã lỗi trả về và Thử lại |
| Admin con không thấy shop | Shop chưa được gán hoặc bị gán sai | Admin tổng vào gán lại shop |
| Shop không sửa được cước | Cước lấy tự động từ bảng giá | Đây là logic đúng chống gian lận |

---

## 16. Backup / Restore / Vận hành
- **Khuyến nghị:** Khách hàng nên Backup database định kỳ hàng tuần.
- **Trước khi cập nhật hệ thống**, luôn phải Backup dữ liệu để đảm bảo an toàn.
- **Không lưu API Key** ra file word hoặc các tài liệu công khai trên mạng. File backup `.sql` chứa mật khẩu đã băm nhưng vẫn cần được cất trong thư mục nén an toàn.
- Khi nhân sự nghỉ việc, cần truy cập Dashboard **khoá tài khoản (inactive)** ngay lập tức thay vì xoá để giữ lại dữ liệu lịch sử đơn hàng.

---

## 17. Bảo mật
> [!CAUTION] Các quy tắc bảo mật sinh tử
- Tuyệt đối **không chia sẻ tài khoản Admin tổng** cho nhân sự cấp dưới. Dùng chức năng tạo Admin con cho nhân viên.
- Không chia sẻ API Key công khai.
- Không commit file `.env` chứa `DATABASE_URL` lên GitHub/mạng xã hội.
- Không gửi `DATABASE_URL` qua chat nếu không thực sự cần thiết.
- Nếu nghi ngờ lộ thông tin, hãy **Đổi API Key** và **Đổi Mật khẩu Database** ngay lập tức.

---

## 18. Tóm tắt kiểm tra production
- Hệ thống đã trải qua quá trình audit end-to-end chuyên sâu.
- Các lệnh cấu trúc Database (`npx prisma validate/generate`) đã pass 100%.
- Cú pháp code (`npm run lint/build`) hoàn toàn không lỗi.
- Cơ chế Admin tổng/Admin con/Shop hoàn toàn đúng quyền.
- Hệ thống tính toán lợi nhuận qua Bảng giá theo shop đạt độ chuẩn xác tuyệt đối.
- Module Thông luồng đơn hàng (Routing) hoạt động vô cùng ổn định.
- Dashboard và các loại Report đều trả về con số chính xác.
- **Trạng thái kết luận cuối cùng:** READY FOR REAL PRODUCTION RUN.
