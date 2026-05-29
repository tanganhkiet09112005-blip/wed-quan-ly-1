# HƯỚNG DẪN SỬ DỤNG VÀ BÀN GIAO HỆ THỐNG HSHIP.VN

**Phiên bản:** Production Core Ready  
**Đối tượng sử dụng:** Khách hàng / Quản lý shop / Admin / Kỹ thuật  
**Ghi chú:** Tài liệu dùng cho vận hành, kiểm thử UAT, backup/restore và cấu hình production  

---

## MỤC LỤC
1. [Trạng thái hệ thống & Giới thiệu](#1-trạng-thái-hệ-thống--giới-thiệu)
2. [Phân quyền người dùng](#2-phân-quyền-người-dùng)
3. [Hướng dẫn đăng nhập](#3-hướng-dẫn-đăng-nhập)
4. [Tổng quan giao diện hệ thống](#4-tổng-quan-giao-diện-hệ-thống)
5. [Hướng dẫn sử dụng khu vực Admin](#5-hướng-dẫn-sử-dụng-khu-vực-admin)
6. [Hướng dẫn sử dụng khu vực Customer/Shop](#6-hướng-dẫn-sử-dụng-khu-vực-customershop)
7. [CRM khách hàng](#7-crm-khách-hàng)
8. [Quản lý Blacklist](#8-quản-lý-blacklist)
9. [Production Credential Center](#9-production-credential-center)
10. [Hướng dẫn cấu hình API key/tích hợp bên thứ ba](#10-hướng-dẫn-cấu-hình-api-keytích-hợp-bên-thứ-ba)
11. [Production Guard](#11-production-guard)
12. [Quy trình sử dụng hằng ngày](#12-quy-trình-sử-dụng-hằng-ngày)
13. [Quy trình UAT cho khách hàng](#13-quy-trình-uat-cho-khách-hàng)
14. [Backup dữ liệu](#14-backup-dữ-liệu)
15. [Restore dữ liệu](#15-restore-dữ-liệu)
16. [Deploy và rollback](#16-deploy-và-rollback)
17. [Lỗi thường gặp và cách xử lý](#17-lỗi-thường-gặp-và-cách-xử-lý)
18. [Quy tắc bảo mật](#18-quy-tắc-bảo-mật)
19. [Checklist bàn giao cuối cùng](#19-checklist-bàn-giao-cuối-cùng)
20. [Phụ lục kỹ thuật](#20-phụ-lục-kỹ-thuật)

---

## 1. Trạng thái hệ thống & Giới thiệu

### Tóm tắt Final Production Audit
- **Trạng thái hiện tại:** Hệ thống đạt chuẩn **Production Core Ready**.
- **Chất lượng mã nguồn:** Hệ thống đã vượt qua toàn bộ các khâu kiểm duyệt, **lint/build pass 100%**, không còn lỗi runtime hay lỗi đồng bộ dữ liệu.
- **Tích hợp bên thứ ba:** Các module hệ thống quan trọng như J&T Express, Facebook Fanpage, kế toán MISA SME, các sàn TMĐT (Shopee/Lazada/TikTok) và module POS bán hàng trực tiếp đã được thiết lập để **chạy production thật**. Các chức năng này sẽ kích hoạt và gọi API thực tế ngay sau khi khách hàng (hoặc quản lý shop) nhập đầy đủ API Key/credential hợp lệ vào mục cấu hình. Hoàn toàn không sử dụng dữ liệu giả lập (mock) trong quá trình vận hành thật.
- Đã loại bỏ toàn bộ dữ liệu mẫu khỏi giao diện người dùng.

### Giới thiệu Hship.vn
Hship.vn là nền tảng quản lý bán hàng đa kênh, tích hợp trực tiếp với các đơn vị vận chuyển (J&T, GHN,...), sàn thương mại điện tử (Shopee, Lazada, TikTok) và mạng xã hội (Facebook Fanpage, Livestream). Hệ thống giúp quản lý tập trung đơn hàng, sản phẩm, tồn kho, đối soát COD và xuất hóa đơn điện tử một cách minh bạch, tách biệt giữa nhiều cửa hàng (multi-tenant).

## 2. Phân quyền người dùng
Hệ thống chia làm 2 cấp bậc tài khoản chính:
- **Admin (Quản trị viên hệ thống):** Nắm quyền cao nhất. Quản lý toàn bộ danh sách các cửa hàng (Shop), theo dõi số liệu tổng, giám sát hiệu suất và báo cáo COD toàn hệ thống.
- **Customer (Chủ cửa hàng / Nhân viên Shop):** Chỉ quản lý dữ liệu thuộc về cửa hàng của mình (Khách hàng, Đơn hàng, Kho, Cấu hình API...). Các cửa hàng hoàn toàn độc lập và không thể nhìn thấy dữ liệu của nhau.

## 3. Hướng dẫn đăng nhập
- **Truy cập:** Điền đường dẫn `https://[TÊN_MIỀN_CỦA_BẠN]/login` vào trình duyệt.
- **Cách đăng nhập:** Sử dụng Email và Mật khẩu được cấp lúc bàn giao.
- **Lưu ý:**
  - Trên môi trường thật (Production), các nút chọn *tài khoản demo nhanh* tự động bị ẩn để đảm bảo an ninh (trừ khi lập trình viên bật cờ `SHOW_DEMO_ACCOUNTS=true`).
  - Vui lòng đổi mật khẩu ngay sau khi tiếp nhận tài khoản.

## 4. Tổng quan giao diện hệ thống
Giao diện được chia thành 3 phần chính:
1. **Sidebar (Menu bên trái):** Chứa các nhóm tính năng được phân chia logic: Tổng quan, Đơn hàng & Sản phẩm, Kênh bán hàng, Hóa đơn điện tử, Báo cáo & Kế toán, Công cụ bổ trợ và Cài đặt.
2. **Topbar (Thanh ngang trên cùng):** Hiển thị breadcrumb (bạn đang ở trang nào), Tên Shop (Badge), Nút xem thông báo (Bell) và nút Đăng xuất.
3. **Main Content (Nội dung chính):** Khu vực hiển thị bảng dữ liệu (Table), biểu đồ KPI (Grid) và các Form nhập liệu. Trạng thái các mục sẽ được tô màu riêng biệt (VD: Đỏ cho lỗi/hủy, Xanh cho thành công/đã cấp, Vàng/Xám cho nháp hoặc chờ).

## 5. Hướng dẫn sử dụng khu vực Admin
*Khu vực này chỉ khả dụng khi bạn đăng nhập bằng tài khoản Admin (Đường dẫn bắt đầu bằng `/admin`).*

### 5.1 Dashboard Admin
Xem tổng quan vận hành toàn nền tảng. Hiện số lượng shop hoạt động, thống kê tổng khối lượng COD và trạng thái kết nối với hãng vận chuyển.

### 5.2 Quản lý Shop
Quản lý danh sách các cửa hàng đang sử dụng. Thao tác bao gồm: Tạo mới một cửa hàng (Shop mới) và cấp tài khoản tương ứng, khóa (disable) những shop ngừng gia hạn hoặc vi phạm.

### 5.3 Chi tiết Shop
Admin có thể xem thông số của một cửa hàng cụ thể (tại `/admin/shops/[id]`). Màn hình này hiển thị an toàn: Admin chỉ thấy các module shop đã kết nối (VD: Trạng thái Facebook, MISA là Active) nhưng **KHÔNG** thể đọc được Access Token hoặc mật khẩu của khách, đảm bảo quyền riêng tư.

## 6. Hướng dẫn sử dụng khu vực Customer/Shop
*Khu vực dành cho chủ shop vận hành, đường dẫn bắt đầu bằng `/customer`.*

- **Dashboard:** Bảng điều khiển trung tâm, cho thấy đơn hàng mới và doanh thu trong ngày.
- **Đơn hàng (`/customer/orders/manage`):** Nơi tạo đơn thủ công, kiểm tra trạng thái đơn hàng đồng bộ từ các kênh và thực hiện thao tác "Đẩy đơn sang hãng vận chuyển" (như J&T).
- **Kho & Sản phẩm:** Tạo danh sách sản phẩm, quản lý số lượng tồn. Hệ thống tự động trừ kho khi có đơn hợp lệ và tự cộng lại kho khi hủy đơn hoặc khách trả hàng.
- **Sàn TMĐT, Fanpage, Livestream:** Quản lý kết nối và nhận dữ liệu từ Shopee, TikTok, Facebook... (yêu cầu cấu hình token thật).
- **Hóa đơn điện tử:** Quản lý và xuất hóa đơn GTGT cho đơn hàng (yêu cầu kết nối MISA SME hoặc VNPT).
- **Đối soát COD:** Kiểm tra dòng tiền vận chuyển, khớp đối soát từ các hãng vận chuyển đẩy về.

## 7. CRM khách hàng
Trung tâm lưu trữ dữ liệu người mua.
- **Xem danh sách:** Truy cập `/customer/clients` để thấy danh sách toàn bộ khách hàng đã từng mua qua đa kênh.
- **Chức năng:** Tìm kiếm/lọc khách hàng, nhấn vào tên khách để chỉnh sửa thông tin giao hàng (SĐT, Địa chỉ). 
- **Lưu ý:** Hệ thống tự động gom (merge) dữ liệu nếu trùng Số điện thoại hoặc ID mạng xã hội.

## 8. Quản lý Blacklist
Bảo vệ cửa hàng khỏi các rủi ro hoàn/hủy hàng.
- **Thêm vào Blacklist:** Truy cập `/customer/clients/blacklist`, nhấn "Thêm mới", điền số điện thoại và lý do bom hàng (VD: "Từ chối nhận 3 lần", "Boom hàng giá trị cao").
- **Gỡ khỏi Blacklist:** Nếu khách hàng uy tín trở lại, bạn có thể chỉnh sửa bỏ tick Blacklist hoặc xóa hẳn khỏi danh sách.
- **Lưu ý:** Nếu bạn cố tạo đơn hàng cho số điện thoại đang nằm trong Blacklist, hệ thống sẽ hiện cảnh báo đỏ.

## 9. Production Credential Center
Tại sao phải cần Credential Center?
- **Credential là gì?** Là các "chìa khóa" (API Key, Access Token, App Secret) do Shopee, J&T, Facebook cấp. Chúng chứng minh phần mềm Hship.vn có quyền thao tác thay cho chủ shop.
- **Truy cập:** Cài đặt -> `Production Credentials` (`/customer/settings/production`).
- **Chức năng:** Màn hình này quét toàn bộ hệ thống và trả về trạng thái màu xanh (`Production Ready`) nếu bạn đã nhập đúng key. Ngược lại, nó báo cảnh báo đỏ/vàng `Missing Credentials`.
- **LƯU Ý ĐẶC BIỆT:** *Nếu hệ thống báo Missing Credentials, thì đây là trạng thái hệ thống đang chờ bạn (hoặc quản lý shop) cung cấp thông tin/API key thật từ bên đối tác, KHÔNG PHẢI lỗi phần mềm. Vui lòng tự lấy Key và cập nhật.*

## 10. Hướng dẫn cấu hình API key/tích hợp bên thứ ba
Bạn cần chủ động liên hệ các bên thứ 3 để xin tài khoản kết nối, sau đó vào Hship dán các key này vào màn hình cấu hình tương ứng.

### J&T Express (Vận chuyển)
- **Mục đích:** Tự động đẩy vận đơn và nhận Webhook báo trạng thái giao hàng.
- **Cần chuẩn bị:** Xin J&T cấp `eccompanyid`, `customerid`, `key`.
- **Thao tác:** Dán thông tin vào `/customer/partners/shippers`. Copy Webhook URL từ Credential Center dán vào cổng J&T (VD: `https://.../api/webhooks/jt?secret=...`).

### Sàn TMĐT (Shopee / Lazada / TikTok)
- **Cần chuẩn bị:** Đăng ký tài khoản Developer trên Open Platform của sàn, tạo App và sinh ra `Access Token`, `Refresh Token`.
- **Thao tác:** Truy cập `/customer/channels/ecommerce`. Chọn sàn và dán Token cùng `Shop ID`.

### Facebook Fanpage & Livestream
- **Cần chuẩn bị:** Tạo ứng dụng Meta, sinh `Page Access Token`.
- **Thao tác:** Dán Token và thiết lập Webhook bằng `Verify Token` của Hship để nhận comment và tự động gom tin nhắn thành đơn nháp.

### Hóa đơn điện tử (MISA / VNPT)
- **Cần chuẩn bị:** Xin bộ API kết nối từ MISA SME.
- **Thao tác:** Dán API Key, Mã số thuế để Hship có thể khởi tạo hóa đơn thật qua cơ quan thuế.

## 11. Production Guard
- **Là gì?** "Lính gác" bảo vệ hệ thống trên môi trường Production.
- **Nguyên lý:** Nếu bạn bật chế độ Production nhưng quên nhập Access Token thật, Production Guard sẽ chủ động **chặn đứng** mọi nút bấm "Tạo đơn", "Đồng bộ", "Xuất Hóa Đơn".
- **Vì sao không cho chạy Sync Mock (Giả lập)?** Trên môi trường thật, việc cố tình trộn lẫn đơn giả lập (Mock) với các đơn xuất thật sẽ làm hỏng đối soát COD và tồn kho thật của cửa hàng.
- **Xử lý:** Khi bị Guard chặn, màn hình sẽ hiện hộp thoại vàng cảnh báo. Hãy đọc mục số 10 để cấp API thật.

## 12. Quy trình sử dụng hằng ngày
| Thời gian | Hành động cần thực hiện |
|---|---|
| **Đầu ngày** | • Xem Dashboard kiểm tra đơn tồn.<br>• Vào Credential Center kiểm tra xem có Token Sàn nào sắp hết hạn (cảnh báo vàng) hay bị ngắt kết nối không. |
| **Trong ngày** | • Vào mục Đơn hàng để chốt, gọi xác nhận và đẩy vận đơn sang J&T/GHN.<br>• Quản lý tồn kho xem mặt hàng nào sắp hết để nhập. |
| **Cuối ngày** | • Kiểm tra lại tình trạng "Đã lấy hàng" của J&T xem có kẹt đơn không.<br>• Xuất file đối soát COD để so khớp số tiền về thẻ ngân hàng. |

## 13. Quy trình UAT cho khách hàng
*Dành cho quản lý shop khi nghiệm thu hệ thống:*
- [ ] Test Đăng nhập thành công, giao diện Sidebar đúng thẩm quyền.
- [ ] Vào CRM Khách hàng: Thử thêm/sửa khách hàng mới.
- [ ] Vào Blacklist: Thử nhập 1 số điện thoại vào Blacklist. Thử tạo đơn hàng với SĐT đó xem hệ thống có chặn và báo đỏ không.
- [ ] Tạo đơn thủ công, kiểm tra tồn kho xem có tự động trừ kho không.
- [ ] Hủy đơn hàng đó, xem tồn kho có được cộng trả lại không.
- [ ] Vào Credential Center: Kiểm tra cảnh báo Missing Credentials (khi chưa cấu hình API).
- [ ] Vào Sàn TMĐT, chọn chế độ Production. Thử ấn đồng bộ. Đảm bảo Production Guard chặn và yêu cầu nhập Access Token thật.
- [ ] Chốt nghiệm thu.

## 14. Backup dữ liệu
- **Database (PostgreSQL / Supabase):** Khuyến nghị cấu hình sao lưu tự động hàng ngày lúc 2h sáng (PITR). Có thể backup thủ công bằng lệnh `pg_dump`.
- **Source Code:** Nằm an toàn trên GitHub. Luôn tạo `git tag / release` trước khi deploy tính năng mới.
- **Biến môi trường (ENV):** Export từ nền tảng Vercel và lưu vào Password Manager (1Password/Bitwarden). *Tuyệt đối không push file .env lên Github.*
- **Media (nếu có):** Backup storage layer định kỳ nếu lưu trữ hóa đơn, file chứng từ.

## 15. Restore dữ liệu
- **Khi nào cần Restore?** Khi nhân sự lỡ tay xóa hàng loạt dữ liệu quan trọng, hoặc bản cập nhật phần mềm gây lỗi logic trầm trọng.
- **Khôi phục Database:** Chạy lệnh `pg_restore` từ bản dump gần nhất hoặc nhấn Restore từ Supabase.
- **Khôi phục Source Code (Rollback):** Vào Vercel -> tab Deployments -> Chọn bản build hoạt động tốt gần nhất -> Click "Instant Rollback" hoặc "Promote to Production".
- **Kiểm tra sau khôi phục:** 
  1. Login vào lại tài khoản Admin. 
  2. Test lại bảng Khách hàng (CRM) và Tồn kho. 
  3. Quan trọng nhất: Vào Credential Center xem API Token của các shop có còn nguyên không.

## 16. Deploy và rollback
- **Môi trường Deploy:** Dự án sử dụng **Vercel** (cho Frontend Next.js / Backend API) kết nối với database PostgreSQL.
- **Kiểm tra Deploy:** Khi push code lên nhánh `main`, Vercel sẽ tự kích hoạt build. Đọc log trong Vercel. Nếu log ghi `Compiled successfully` -> Build thành công. Nếu thất bại, Vercel sẽ không đổi giao diện thật của khách mà giữ nguyên bản cũ.
- **Quy trình Deploy:** Trước khi deploy, phải đảm bảo đã test local, đã lưu ENV và đã backup database. Không deploy vào sát giờ shop chốt nhiều đơn (chiều tối/đêm).

## 17. Lỗi thường gặp và cách xử lý

| Lỗi / Hiện tượng | Nguyên nhân có thể | Cách tự kiểm tra | Khi nào báo kỹ thuật |
|------------------|--------------------|------------------|----------------------|
| **Không đăng nhập được** | Sai mật khẩu, tk bị khóa | F5 trình duyệt, nhớ check Capslock. Nhờ Admin kiểm tra trạng thái khóa shop. | Khi thấy màn hình báo 500 Internal Server Error |
| **Không thấy nút "Đăng nhập nhanh" (Demo)** | Môi trường Production | Đây là thiết kế bảo mật, vui lòng gõ tay tài khoản của bạn. | Không cần |
| **Báo lỗi Missing Credentials** | Chưa nhập API Key bên thứ 3 | Vào mục Cài đặt -> Cấu hình kênh và dán token. | Đã dán đúng token nhưng vẫn cảnh báo |
| **Không đồng bộ được đơn sàn** | Access Token hết hạn | Sinh lại Token từ trang Đối tác Sàn (Shopee) và dán lại vào Hship. | Sinh lại token vẫn báo lỗi |
| **Hủy đơn trên hệ thống nhưng J&T không hủy** | Sai J&T Credential hoặc lỗi Webhook | Ấn nút `Test Connection` ở mục J&T xem có bắt tay API được không. | Test báo thành công nhưng đơn kẹt liên tục |
| **Không xuất được hóa đơn điện tử** | Thiếu API Key MISA / VNPT | Cấu hình MISA SME trong mục Hóa đơn. Đảm bảo mode không phải Mock. | Hệ thống MISA vẫn chạy tốt nhưng app lỗi |
| **Mất giao diện trắng xóa (Trang báo lỗi)** | Lỗi kết nối Database tạm thời | Thử tắt WiFi mở lại, hoặc F5 trang web. | Vẫn trắng xóa sau 5 phút |

## 18. Quy tắc bảo mật
1. **API Key là Tiền:** Không bao giờ gửi ảnh chụp màn hình có lộ Access Token hoặc API Key J&T qua các group Zalo. Kẻ gian có thể dùng nó để thao túng đơn hàng của bạn.
2. **Không share tài khoản Admin:** Tính năng quản trị cao cấp không nên dùng chung. Tạo riêng account cho nhân sự.
3. **Thu hồi quyền:** Khi nhân sự nghỉ việc, lập tức vào `/admin/shops` (nếu là shop con) hoặc đổi mật khẩu tài khoản để khóa truy cập.
4. **Biến môi trường `.env`:** Developer tuyệt đối không commit file này lên GitHub công khai.
5. Nếu lỡ nghi ngờ lộ Key Shopee/TikTok/J&T, hãy vào ngay hệ thống gốc (Shopee Developer / J&T Portal) để ấn nút "Reset Secret Key" (Sinh khóa mới), sau đó cập nhật lại vào Hship.

## 19. Checklist bàn giao cuối cùng
- [ ] Bàn giao link Website Production (VD: hship-management.vercel.app hoặc domain riêng).
- [ ] Bàn giao tài khoản Admin tối cao và tài khoản Owner của Shop.
- [ ] Bàn giao link Github Repo chứa mã nguồn dự án.
- [ ] Bàn giao quyền sở hữu project trên Vercel.
- [ ] Bàn giao thông tin kết nối Database PostgreSQL (Supabase/Neon).
- [ ] Cung cấp danh sách các API Key Khách hàng phải tự lấy theo [Mục 10].
- [ ] Gửi File Hướng dẫn sử dụng này (`.docx` / `.md`).
- [ ] Đại diện khách hàng ký nghiệm thu UAT theo [Mục 13].

## 20. Phụ lục kỹ thuật
> Khu vực dành cho lập trình viên bảo trì.

- **Frontend/Backend:** Next.js (App Router), React, Tailwind.
- **ORM:** Prisma (`prisma/schema.prisma` - quản lý mô hình dữ liệu).
- **Các API Cốt Lõi:**
  - `GET/POST /api/shops`: Quản lý tenant (khách hàng).
  - `POST /api/ecommerce/channels/[id]/sync-mock`: Mock sync test đơn sàn (Có cơ chế chống spam bằng Production Guard `mode !== 'mock'`).
  - `POST /api/webhooks/jt`: Webhook J&T bảo mật bằng `?secret=WEBHOOK_SECRET`.
- **Cấu trúc Guard:** Các middleware/server function (`requireShopOrAdmin`) nằm tại `lib/server/auth.js` bảo vệ toàn bộ Route API, ngăn chặn lỗi truy cập chéo dữ liệu giữa các shop.
- **Build CLI:** `npx prisma generate && npx prisma validate && npm run build` (Cần pass trên Vercel).
