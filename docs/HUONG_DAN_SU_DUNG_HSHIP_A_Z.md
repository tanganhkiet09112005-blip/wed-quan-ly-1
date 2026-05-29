# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG HSHIP.VN TỪ A-Z

> **Lưu ý:** Tài liệu này được biên soạn dành cho khách hàng vận hành hệ thống Hship.vn và quản trị viên (Admin). Vui lòng đọc kỹ để nắm vững luồng vận hành, cách cấu hình và quy trình xử lý lỗi cơ bản.

---

## MỤC LỤC
1. [Giới thiệu hệ thống](#1-giới-thiệu-hệ-thống)
2. [Vai trò người dùng](#2-vai-trò-người-dùng)
3. [Đăng nhập hệ thống](#3-đăng-nhập-hệ-thống)
4. [Tổng quan giao diện](#4-tổng-quan-giao-diện)
5. [Hướng dẫn sử dụng khu vực Admin](#5-hướng-dẫn-sử-dụng-khu-vực-admin)
6. [Hướng dẫn sử dụng khu vực Customer/Shop](#6-hướng-dẫn-sử-dụng-khu-vực-customershop)
7. [Production Credential Center](#7-production-credential-center)
8. [Production Guard và ý nghĩa cảnh báo](#8-production-guard-và-ý-nghĩa-cảnh-báo)
9. [Quy trình vận hành hằng ngày](#9-quy-trình-vận-hành-hằng-ngày)
10. [Quy trình cung cấp API Key thật](#10-quy-trình-cung-cấp-api-key-thật)
11. [Backup và Khôi phục (Dành cho Kỹ thuật)](#11-backup-và-khôi-phục-dành-cho-kỹ-thuật)
12. [Lỗi thường gặp và Cách xử lý](#12-lỗi-thường-gặp-và-cách-xử-lý)
13. [Quy tắc bảo mật](#13-quy-tắc-bảo-mật)
14. [Checklist bàn giao và vận hành định kỳ](#14-checklist-bàn-giao-và-vận-hành-định-kỳ)

---

## 1. Giới thiệu hệ thống
Hship.vn là nền tảng quản lý bán hàng đa kênh, tích hợp trực tiếp với các đơn vị vận chuyển (J&T, GHN,...), sàn thương mại điện tử (Shopee, Lazada, TikTok) và mạng xã hội (Facebook Fanpage, Livestream). 
Hệ thống giúp quản lý tập trung đơn hàng, sản phẩm, tồn kho, đối soát COD và xuất hóa đơn điện tử.

## 2. Vai trò người dùng
Hệ thống chia làm 2 cấp bậc tài khoản chính:
- **Admin (Quản trị viên hệ thống):** Quản lý toàn bộ danh sách các cửa hàng (Shop), theo dõi số liệu tổng, xem hóa đơn/báo cáo COD toàn hệ thống.
- **Customer (Chủ cửa hàng / Nhân viên Shop):** Chỉ quản lý dữ liệu thuộc về cửa hàng của mình (Khách hàng, Đơn hàng, Kho, Cấu hình API). Các cửa hàng độc lập và không nhìn thấy dữ liệu của nhau.

## 3. Đăng nhập hệ thống
- **Đường dẫn URL:** `/login`
- **Cách thức đăng nhập:** Sử dụng Email và Mật khẩu được cấp.
- **Lưu ý:**
  - Ở môi trường thật (Production), các tài khoản demo tự động bị ẩn đi để bảo mật.
  - Vui lòng đổi mật khẩu ngay sau khi nhận bàn giao hệ thống.
  - Nếu quên mật khẩu, vui lòng liên hệ Admin hệ thống để cấp lại.

## 4. Tổng quan giao diện
Giao diện được chia thành 3 phần chính:
1. **Sidebar (Menu bên trái):** Chứa các nhóm tính năng (Tổng quan, Đơn hàng, Kênh bán, Cài đặt...). Menu sẽ khác biệt tùy vào vai trò Admin hay Customer.
2. **Topbar (Thanh ngang trên cùng):** Hiển thị breadcrumb (bạn đang ở trang nào), tên Shop, nút thông báo và nút Đăng xuất.
3. **Main Content (Nội dung chính):** Khu vực hiển thị bảng dữ liệu, biểu đồ và các form thao tác.

---

## 5. Hướng dẫn sử dụng khu vực Admin
*Chỉ Admin mới có thể truy cập các đường dẫn bắt đầu bằng `/admin`.*

### 5.1 Dashboard Admin (`/admin/dashboard`)
- **Mục đích:** Xem cái nhìn tổng quan về sức khỏe của toàn bộ hệ thống Hship.vn.
- **Dữ liệu:** Tổng số lượng shop, doanh thu tổng, trạng thái đơn vị vận chuyển, trạng thái COD.
- **Thao tác:** Theo dõi và nhấp vào các số liệu để xem chi tiết.

### 5.2 Quản lý Shop (`/admin/shops`)
- **Mục đích:** Danh sách các khách hàng đang sử dụng nền tảng Hship.vn.
- **Dữ liệu:** Mã shop, Tên shop, Số điện thoại, Email, Trạng thái (Hoạt động/Khóa).
- **Thao tác:** 
  - Tạo shop mới (Cấp tài khoản cho chủ shop).
  - Khóa hoặc mở khóa shop.

### 5.3 Chi tiết Shop (`/admin/shops/[id]`)
- **Mục đích:** Admin xem số liệu chi tiết của 1 shop cụ thể (để hỗ trợ kỹ thuật hoặc đối soát).
- **Dữ liệu:** Cấu hình API của shop, số lượng đơn, doanh thu, kênh bán hàng đang kết nối.
- **Lưu ý:** Admin không thể thấy mật khẩu API của khách, chỉ thấy trạng thái Đã kết nối hay chưa.

---

## 6. Hướng dẫn sử dụng khu vực Customer/Shop
*Khu vực dành riêng cho chủ shop vận hành, đường dẫn bắt đầu bằng `/customer`.*

### 6.1 Dashboard Customer (`/customer/dashboard`)
- **Mục đích:** Bảng điều khiển trung tâm của cửa hàng.
- **Dữ liệu:** Số lượng đơn hàng mới, doanh thu trong ngày, đơn cần xử lý.

### 6.2 Quản lý khách hàng CRM (`/customer/clients`)
- **Mục đích:** Danh sách khách hàng đã từng mua hàng của shop.
- **Thao tác:** Xem lịch sử mua hàng, sửa thông tin liên hệ.
- **Lưu ý:** Khách hàng được tự động lưu vào danh bạ khi phát sinh đơn hàng mới.

### 6.3 Quản lý Blacklist (`/customer/clients/blacklist`)
- **Mục đích:** Quản lý danh sách khách hàng có rủi ro (Bom hàng, hủy ngang).
- **Thao tác:** 
  - Thêm số điện thoại vào Blacklist kèm lý do.
  - Sửa lý do hoặc gỡ khách khỏi danh sách Blacklist nếu họ mua uy tín lại.
- **Lưu ý:** Khi tạo đơn hàng mới, hệ thống tự động cảnh báo nếu số điện thoại nằm trong Blacklist.

### 6.4 Sản phẩm & Kho (`/customer/products` và `/customer/inventory`)
- **Mục đích:** Quản lý danh sách mặt hàng bán và số lượng tồn.
- **Thao tác:**
  - Tạo sản phẩm mới, thêm SKU.
  - Kiểm tra tồn kho tổng. 
- **Lưu ý:** Đơn hàng được tạo thành công sẽ tự trừ kho, khi hủy đơn sẽ tự hoàn kho.

### 6.5 Quản lý đơn hàng (`/customer/orders/manage`)
- **Mục đích:** Nơi xử lý tập trung mọi đơn hàng đổ về từ mọi kênh (Sàn, Facebook, POS).
- **Thao tác:** 
  - Tạo đơn thủ công.
  - Chuyển trạng thái đơn.
  - Đẩy vận đơn sang hãng vận chuyển (J&T, GHN).

### 6.6 Ecommerce / Sàn TMĐT (`/customer/channels/ecommerce`)
- **Mục đích:** Kết nối Shopee, Lazada, TikTok Shop.
- **Thao tác:** Nhập ID Gian Hàng và Access Token để hệ thống đồng bộ đơn về.
- **Lỗi thường gặp:** Mất kết nối sàn. Nguyên nhân thường do Token hết hạn (Cần cấp lại Refresh Token).

### 6.7 Facebook Fanpage & Livestream (`/customer/channels/fanpage`)
- **Mục đích:** Quản lý hội thoại Facebook, chốt đơn tự động qua chatbot từ comment.
- **Trạng thái:** Yêu cầu Page Token thật để lấy comment trực tiếp.

### 6.8 Hóa đơn điện tử (`/customer/invoices`)
- **Mục đích:** Khởi tạo, xem và in hóa đơn GTGT.
- **Lưu ý:** Cần liên kết tài khoản MISA SME / VNPT Invoice ở trang Cài đặt trước khi có thể xuất hóa đơn hợp lệ.

### 6.9 Cài đặt Production Credential (`/customer/settings/production`)
*(Xem mục 7 phía dưới)*

---

## 7. Production Credential Center
- **Đường dẫn URL:** `/customer/settings/production`
- **Mục đích:** Đây là trung tâm kiểm soát kết nối thật. "Credential" là các mã bí mật (API Key, Token) dùng để chứng minh với J&T, Facebook, Shopee... rằng phần mềm Hship được phép thao tác trên tài khoản của shop.
- **Tính năng:**
  - Hiển thị trạng thái xanh (**Production Ready**) nếu shop đã nhập key.
  - Hiển thị trạng thái cam/đỏ (**Pending / Missing Credentials**) nếu chưa cấu hình.
  - Cung cấp **Webhook URL** để shop copy và dán vào hệ thống đối tác (Ví dụ gửi cho J&T để nhận cập nhật trạng thái giao hàng).

## 8. Production Guard và ý nghĩa cảnh báo
Để tránh việc shop tạo ra các đơn hàng "ảo" trên môi trường làm việc thật, Hship tích hợp **Production Guard**:
- **Cơ chế:** Nếu thiếu API Key, hệ thống sẽ CHẶN thao tác đồng bộ thật và hiện cảnh báo màu vàng "Missing Credentials".
- **Mock Mode (Giả lập):** Trong lúc chưa có key thật, shop có thể bật `Chế độ Mock` tại các màn hình Sàn, Facebook, Hóa đơn để "Sync Mock" (tạo đơn ảo) nhằm xem thử cách hệ thống chạy.
- **Lưu ý Quan Trọng:** *Lỗi không đồng bộ được do Guard chặn KHÔNG PHẢI lỗi phần mềm Hship*, mà là hệ thống đang bảo vệ dữ liệu, yêu cầu bạn nhập key thật của sàn.

---

## 9. Quy trình vận hành hằng ngày
1. Đăng nhập hệ thống vào buổi sáng.
2. Kiểm tra `Dashboard` xem có đơn hàng nào từ hôm qua chưa xử lý.
3. Mở tab `Sàn TMĐT` và `Facebook`, đảm bảo không có cảnh báo mất kết nối (Token hết hạn).
4. Vào `Đơn hàng`, xử lý các đơn "Chờ xác nhận", đóng gói, và ấn "Đẩy sang hãng vận chuyển".
5. Cuối ngày, vào `Đối soát COD` để kiểm tra dòng tiền từ hãng vận chuyển.

## 10. Quy trình cung cấp API Key thật
Khách hàng tự lấy Key từ các dịch vụ và nhập vào hệ thống:
1. **J&T / GHN:** Liên hệ sale/CSKH hãng vận chuyển xin tài khoản Open API. Bạn sẽ nhận được `eccompanyid`, `customerid`, `key`.
2. **Shopee/Lazada/TikTok:** Đăng nhập vào Open Platform, tạo App, ủy quyền tài khoản shop và lấy `Access Token`.
3. **Facebook:** Vào Meta for Developers tạo app, lấy `Page Access Token`.
4. Sau khi có đủ, vào `Production Credential Center`, ấn nút **Cấu hình** ở từng mục để dán key vào.

---

## 11. Backup và Khôi phục (Dành cho Kỹ thuật)

### 11.1 Backup Dữ Liệu
Hệ thống sử dụng **PostgreSQL** (hoặc Supabase) và **Prisma ORM**.
- **Backup CSDL (Supabase):** 
  1. Đăng nhập Supabase Dashboard.
  2. Chọn Project -> Database -> Backups.
  3. Supabase tự động backup hàng ngày (PITR). Bạn cũng có thể dùng lệnh: `pg_dump -U postgres -h [HOST] [DB_NAME] > backup.sql`.
- **Backup Biến Môi Trường (ENV):**
  - Vào Vercel -> Project -> Settings -> Environment Variables. 
  - Tải xuống hoặc copy toàn bộ lưu vào nơi an toàn (Mật khẩu NextAuth, Database URL). *Tuyệt đối không gửi qua Zalo/Facebook công khai.*
- **Backup Code:** Code nằm trên GitHub Repo. Luôn tạo `Release Tag` (ví dụ `v1.0.0`) trước khi deploy bản cập nhật lớn.

### 11.2 Restore (Khôi phục) và Xử lý sự cố Deploy
- **Khôi phục CSDL:** 
  1. Vào Supabase Dashboard -> Backups -> Chọn bản sao lưu gần nhất -> Restore.
  2. Hoặc chạy `psql -U postgres -h [HOST] [DB_NAME] < backup.sql`.
- **Rollback Code (Vercel):**
  - Vào Vercel -> Deployments -> Chọn bản build cũ đang hoạt động tốt -> Click **Promote to Production** hoặc **Rollback**.
- **Kiểm tra sau khi khôi phục:**
  - Login lại tài khoản Admin.
  - Kiểm tra `/customer/settings/production` xem các API Key có bị mất không (nếu mất phải xin khách nhập lại).

---

## 12. Lỗi thường gặp và Cách xử lý

| Lỗi / Hiện tượng | Nguyên nhân có thể | Cách khách tự kiểm tra / Xử lý | Khi nào gọi Dev |
|------------------|--------------------|--------------------------------|-----------------|
| **Không đăng nhập được** | Nhập sai mật khẩu, tài khoản bị khóa | Kiểm tra lại Capslock. Nhờ Admin reset mật khẩu | Lỗi 500 server error |
| **Bị báo "Missing Credentials"** | Chưa cấu hình khóa API cho module đó | Vào mục Cài đặt -> Cấu hình kênh và nhập API Key | Đã nhập đúng Key nhưng vẫn lỗi |
| **Không đồng bộ đơn Shopee** | Access Token hết hạn | Sinh lại Token từ trang Shopee và dán lại | Sinh lại token vẫn không lấy được đơn |
| **Hủy đơn trên hệ thống nhưng J&T không hủy** | Endpoint cấu hình J&T sai hoặc J&T thay đổi API | Vào `Production Credential`, thử Test Connection J&T | Kết nối J&T báo thành công nhưng đơn vẫn kẹt |
| **Lỗi "500 Internal Server Error"** | Mất kết nối DB hoặc lỗi logic xử lý | Thử tải lại trang (F5) | Báo dev kèm theo ảnh chụp màn hình lúc bị lỗi |

---

## 13. Quy tắc bảo mật
1. **Tuyệt đối KHÔNG chia sẻ API Key, Access Token** của bất kỳ sàn nào trên mạng xã hội. 
2. **Không chia sẻ tài khoản Admin.** Nếu có nhiều nhân viên, hãy tạo tài khoản cho từng người.
3. Khi nhân viên nghỉ việc, Admin cần **khóa tài khoản** của nhân viên đó lập tức.
4. Quản trị viên kỹ thuật **KHÔNG lưu file `.env`** vào Github. Đưa vào `.gitignore` cẩn thận.

---

## 14. Checklist bàn giao và vận hành định kỳ

### Checklist Bàn giao
- [ ] Link tên miền Production đã hoạt động.
- [ ] Bàn giao tài khoản Admin tối cao.
- [ ] Bàn giao source code repo (GitHub) và quyền truy cập Vercel/Supabase cho đại diện kỹ thuật của khách.
- [ ] Cung cấp tài liệu này (`HUONG_DAN_SU_DUNG_HSHIP_A_Z.md`) và danh sách API Key cần chuẩn bị.

### Checklist Vận hành (Admin thực hiện hàng tuần)
- [ ] Kiểm tra Vercel logs xem có cảnh báo bộ nhớ (RAM/CPU) hay lỗi vặt không.
- [ ] Export bảng Blacklist dự phòng (nếu cần).
- [ ] Nhắc nhở các Shop gia hạn Access Token của Shopee/TikTok trước khi hết hạn.

---
*Tài liệu được soạn thảo tự động dựa trên cấu trúc vận hành thực tế của Hship.vn phiên bản 1.0.*
