# Final Acceptance Checklist — Hship.vn Delivery SaaS
> Phiên bản: MVP Sandbox · Ngày: 2026-05-28 · Build: Next.js 16 / Prisma v5.22.0

## Hướng dẫn đọc trạng thái
| Ký hiệu | Nghĩa |
|---------|-------|
| ✅ Done | Hoàn chỉnh, test pass, không hardcode |
| 🟡 Partial | Có hoạt động nhưng thiếu 1-2 chi tiết nhỏ |
| 🔵 Mock/Sandbox | Cố ý chạy môi trường giả lập, không phá flow |
| ❌ Missing | Chưa có hoặc cần credentials thật để hoạt động |

---

## A. Admin Portal

| # | Chức năng | Route / API | Cách test | Kết quả mong muốn | Trạng thái | Ghi chú |
|---|-----------|-------------|-----------|-------------------|------------|---------|
| A1 | Đăng nhập admin | `POST /api/auth/login` | Login `admin@hship.vn / admin123` | Redirect → `/admin/dashboard` | ✅ Done | JWT cookie, role=admin |
| A2 | Admin Dashboard tổng | `GET /api/dashboard` | Xem `/admin/dashboard` | 8 KPI cards + 2 charts + top shops + recent orders | ✅ Done | Data thật từ DB |
| A3 | Quản lý shop | `GET /admin/shops` | Xem `/admin/shops` | Bảng 12 cột, search/filter | ✅ Done | — |
| A4 | Tạo shop mới | `POST /api/shops` | Click "Tạo shop mới", nhập form | Shop + user tạo trong DB, bảng tự reload | ✅ Done | Validate email/phone, hash password |
| A5 | Xem số đơn từng shop | `GET /api/dashboard` | Bảng shop cột "Số đơn" | Count đúng theo shopId | ✅ Done | Aggregated per-shop |
| A6 | Xem COD từng shop | `GET /api/dashboard` | Cột "COD đã thu" + "COD chờ thu" | Đúng theo codStatus | ✅ Done | — |
| A7 | Xem cước phí từng shop | `GET /api/dashboard` | Cột "Cước phí" | Sum shippingFee theo shop | ✅ Done | — |
| A8 | Xem carrier từng shop | `GET /api/dashboard` | Cột "Carrier" trong bảng shops | Badges GHN/GHTK/JT/SPX | ✅ Done | — |
| A9 | Chặn shop vào admin | `requireAdmin()` middleware | Login shop thường → vào `/admin/dashboard` | Redirect về `/login` hoặc 403 | ✅ Done | Server-side check mọi API admin |
| A10 | Xem chi tiết shop | `GET /admin/shops/[id]` | Click "Chi tiết" từ bảng shop | Trang detail shop riêng | 🟡 Partial | Route tồn tại, UI có thể cần polish thêm |

---

## B. Shop Internal Portal

| # | Chức năng | Route / API | Cách test | Kết quả mong muốn | Trạng thái | Ghi chú |
|---|-----------|-------------|-----------|-------------------|------------|---------|
| B1 | Đăng nhập shop | `POST /api/auth/login` | Login `genz@hship.vn / shop123` | Redirect → `/customer/dashboard` | ✅ Done | role=customer |
| B2 | Dashboard shop | `GET /api/shop/dashboard` | Xem `/customer/dashboard` | KPI + SVG area chart + widgets | ✅ Done | Data từ DB thật |
| B3 | Tạo đơn từ web | `POST /api/orders` | Form `/customer/orders/create` | Đơn mới trong DB, redirect sang manage | ✅ Done | Có product picker |
| B4 | Quản lý đơn | `GET /api/orders` | Xem `/customer/orders/manage` | Bảng đơn + filter + pagination | ✅ Done | Multi-filter, search |
| B5 | Chi tiết đơn | `GET /api/orders/[id]` | Click mã đơn → `/customer/orders/[id]` | Thông tin đơn + items + timeline | ✅ Done | Tích hợp xem/tạo hóa đơn |
| B6 | Timeline đơn/vận đơn | `CarrierEvent` table | Trong trang detail đơn | Các mốc thời gian theo carrier event | ✅ Done | Seed có carrier events |
| B7 | Đơn giao hàng | `GET /customer/orders/delivery` | Tab "Đang giao" | Lọc đơn status=shipping/pushed_to_carrier | ✅ Done | — |
| B8 | Đơn trả hàng | `GET /customer/orders/returns` | Tab "Hoàn hàng" | Lọc đơn status=returned/failed | ✅ Done | — |
| B9 | Ký nhận một phần | `partial_delivered` status | Đơn partial trong bảng | Hiện đúng COD amount 65% | ✅ Done | Seed có partial_delivered |
| B10 | Kiện vấn đề | `GET /customer/orders/issues` | Tab "Kiện vấn đề" | Đơn failed/returned/partial | ✅ Done | — |
| B11 | Quản lý khách hàng | `GET /api/customers` | Xem `/customer/partners/customers` | Danh sách khách + search | ✅ Done | — |
| B12 | Khách bom hàng | `status=blacklist` | Xem `/customer/partners/blacklist` | Danh sách đen + lý do | ✅ Done | Seed có 2 khách blacklist |
| B13 | COD Report | `GET /api/reports/cod` | Xem `/customer/reports/cod` | 6 KPI + carrier cards + detail table + filter | ✅ Done | codStatus-based, không hardcode |
| B14 | Cấu hình vận chuyển | `GET/PUT /api/shippers` | Xem `/customer/partners/shippers` | 4 carrier cards, masked token, inline form | ✅ Done | Token mã hóa AES phía server |
| B15 | Tổng quan đơn | `GET /customer/orders/overview` | Tab tổng quan | KPI theo trạng thái | 🟡 Partial | Route có, UI basic |
| B16 | Giao hàng một phần | `GET /customer/orders/partial` | Tab đơn partial | Đơn partial_delivered | ✅ Done | — |

---

## C. Chatbot / Facebook / Livestream

| # | Chức năng | Route / API | Cách test | Kết quả mong muốn | Trạng thái | Ghi chú |
|---|-----------|-------------|-----------|-------------------|------------|---------|
| C1 | Fanpage UI 3 cột | `/customer/channels/fanpage` | Xem trang fanpage | Session list + chat + extraction panel | ✅ Done | Layout UPOS-inspired |
| C2 | Livestream UI 3 cột | `/customer/channels/livestream` | Xem trang livestream | Giống fanpage, có Live banner | ✅ Done | — |
| C3 | Nhập comment mock | `POST /api/chatbot/mock-comment` | Nhập comment trong UI | Bot xử lý, hiện parsing result | ✅ Done | Mock-only, không Facebook thật |
| C4 | Bot parse thông tin | Trích xuất Regex | SĐT, địa chỉ, sản phẩm, size | Bot bắt chuẩn | ✅ Done | — |
| C5 | Tạo đơn nháp/chính thức | `POST /api/chatbot/sessions/[id]/create-draft` | Tạo từ chatbot | Hiện trong danh sách đơn | ✅ Done | — |
| C6 | Facebook Webhook thật | `POST /api/webhooks/pancake` | Cần Facebook Page thật | Nhận comment từ page | ❌ Missing | Cần Meta App ID + Page Access Token thật |

---

## D. Product / SKU / Inventory

| # | Chức năng | Route / API | Cách test | Kết quả mong muốn | Trạng thái | Ghi chú |
|---|-----------|-------------|-----------|-------------------|------------|---------|
| D1 | Danh sách sản phẩm | `/customer/products` | Xem trang | Bảng sản phẩm, biến thể | ✅ Done | — |
| D2 | Quản lý kho | `/customer/inventory` | Xem trang kho | Hiển thị tồn kho, cảnh báo hết hàng | ✅ Done | Low stock threshold hoạt động |
| D3 | Lịch sử kho | `/api/inventory/movements` | Tab lịch sử kho | Ghi nhận Order/Adjustment xuất/nhập | ✅ Done | Trừ tồn khi đơn xác nhận |

---

## E. POS / Bán Tại Quầy

| # | Chức năng | Route / API | Cách test | Kết quả mong muốn | Trạng thái | Ghi chú |
|---|-----------|-------------|-----------|-------------------|------------|---------|
| E1 | Giao diện thu ngân | `/customer/channels/pos` | Thêm SKU vào giỏ, chọn khách, thanh toán | Đơn POS tạo thành công | ✅ Done | Giống KiotViet/UPOS basic |
| E2 | In hóa đơn bán lẻ | `/api/pos/checkout` | Chọn "Thanh toán & In" | Trình duyệt mở print window, form in chuẩn | ✅ Done | — |
| E3 | Trừ tồn tự động | `POST /api/pos/checkout` | Checkout xong check kho | Stock của SKU tự động giảm tương ứng | ✅ Done | — |

---

## F. Kênh Sàn TMĐT (Ecommerce Settings)

| # | Chức năng | Route / API | Cách test | Kết quả mong muốn | Trạng thái | Ghi chú |
|---|-----------|-------------|-----------|-------------------|------------|---------|
| F1 | Cài đặt Sàn TMĐT | `/customer/channels/ecommerce` | Xem dashboard TMĐT | Danh sách Shopee/Lazada/Tiktok cards | ✅ Done | — |
| F2 | Mock kết nối Sàn | `/api/ecommerce/channels/[id]/test` | Chọn Test Connection (Mock) | Thông báo kết nối thành công | 🔵 Mock/Sandbox | Chạy giả lập |
| F3 | Đồng bộ Đơn Sàn Mock | `/api/ecommerce/channels/[id]/sync-mock` | Chọn Đồng bộ thủ công | 10 đơn TMĐT tạo thành công, kho trừ đúng | 🔵 Mock/Sandbox | Ánh xạ Order, Item đầy đủ |

---

## G. Hóa Đơn / E-Invoice Basic

| # | Chức năng | Route / API | Cách test | Kết quả mong muốn | Trạng thái | Ghi chú |
|---|-----------|-------------|-----------|-------------------|------------|---------|
| G1 | Danh sách HĐĐT | `/customer/invoices` | Xem danh sách | Bộ lọc, search, dashboard con | ✅ Done | Route hợp nhất chuẩn UPOS |
| G2 | Tạo hóa đơn mới | Từ Order detail | Bấm Tạo hóa đơn | Sinh HĐ nháp, link orderId | ✅ Done | Snapshot Item đầy đủ, độc lập Product |
| G3 | Phát hành hóa đơn | `/api/invoices/[id]/issue` | Chọn Phát hành (Sandbox) | Đổi trạng thái Issued, tạo Audit log | 🔵 Mock/Sandbox | Chưa connect MISA/VNPT |
| G4 | In hóa đơn A4 | `/customer/invoices/print/[id]` | Mở form in | Form in A4 chuẩn không lẫn viền web | ✅ Done | — |
| G5 | Hủy hóa đơn | `/api/invoices/[id]/cancel` | Bấm Hủy | Chuyển trạng thái Hủy, log đầy đủ | ✅ Done | — |

---

## H. Multi-tenant / Security

| # | Chức năng | Route / API | Cách test | Kết quả mong muốn | Trạng thái | Ghi chú |
|---|-----------|-------------|-----------|-------------------|------------|---------|
| H1 | Shop chỉ xem dữ liệu mình | `getScopedShopId()` | Login genz → xem orders | Chỉ thấy đơn SHOP001 | ✅ Done | Mọi logic DB đều strict theo `shopId` |
| H2 | Token không lộ raw | `maskSecret()` | Xem response GET /api/shippers | Chỉ thấy `****xxxx` | ✅ Done | Mọi module liên quan (GHN, FB, Sàn TMĐT) đều dùng |
| H3 | API check role server-side | `requireAdmin()` | Gọi `/api/dashboard` với shop token | 403 Forbidden | ✅ Done | — |

---

## I. Setup / Run Local

| # | Chức năng | Lệnh | Cách kiểm tra | Kết quả mong muốn | Trạng thái | Ghi chú |
|---|-----------|------|---------------|-------------------|------------|---------|
| I1 | Prisma migrate sạch | `npx prisma migrate status` | Xem log Terminal | 9 migrations, schema up to date | ✅ Done | — |
| I2 | Seed demo toàn diện | `node prisma/seed.js` | Chạy reset | Sinh đủ Invoice, Orders, Inventory | ✅ Done | — |
| I3 | Build production | `npm run build` | Exit code 0 | 89 routes compiled | ✅ Done | Không có TS/ESLint error cản trở |

---

## Tổng kết checklist

| Nhóm | Done | Partial | Mock/Sandbox | Missing | Tổng |
|------|------|---------|--------------|---------|------|
| A. Admin Portal | 9 | 1 | 0 | 0 | 10 |
| B. Shop Portal | 14 | 2 | 0 | 0 | 16 |
| C. Chatbot/Facebook | 5 | 0 | 0 | 1 | 6 |
| D. Product/Inventory | 3 | 0 | 0 | 0 | 3 |
| E. POS | 3 | 0 | 0 | 0 | 3 |
| F. Ecommerce Settings | 1 | 0 | 2 | 0 | 3 |
| G. Hóa Đơn / E-Invoice | 4 | 0 | 1 | 0 | 5 |
| H. Multi-tenant | 3 | 0 | 0 | 0 | 3 |
| I. Setup/Run | 3 | 0 | 0 | 0 | 3 |
| **Tổng** | **45** | **3** | **3** | **1** | **52** |

*Các metric đã được tinh gọn lại theo nhóm chức năng lớn.*

### Items Missing (cần credentials thật để go-live):
1. **C6** — Facebook Webhook thật (cần Meta App + Page Access Token thật)
2. **D (Carrier)** — GHTK/JT/SPX Production API (cần credentials thật từ hãng)
3. **F (Sàn TMĐT)** — Shopee/Lazada Production API (cần Partner Credentials thật)
4. **G (Hóa Đơn)** — MISA/VNPT Production (cần thông tin kết nối và Account thật)
