# Hship — Final Functional Parity Gap Analysis

Ngày tạo: 2026-05-29

---

## Bảng kiểm tra từng module

| Module | Route | API liên quan | Hiện trạng | Chạy thật bằng DB? | Đúng flow? | Còn thiếu | Ưu tiên | Cần schema? | Cần credentials? |
|---|---|---|---|---|---|---|---|---|---|
| **Admin Dashboard** | `/admin/dashboard` | `/api/dashboard` | ✅ Done | ✅ | ✅ | Không | P0 | Không | Không |
| **Admin Shops List** | `/admin/shops` | `/api/shops` GET/POST | ✅ Done | ✅ | ✅ | Không | P0 | Không | Không |
| **Admin Shop Detail** | `/admin/shops/[id]` | `/api/dashboard` | ✅ Done (Partial) | ✅ | ✅ | Icons dùng chữ cái thô → đã fix | P1 | Không | Không |
| **Admin API Shop PATCH** | — | `/api/shops/[id]` | ⚠️ Missing | — | — | Chưa có API PATCH toggle status shop | P1 | Không | Không |
| **Shop Dashboard** | `/customer/dashboard` | `/api/shop/dashboard` | ✅ Done | ✅ | ✅ | Không | P0 | Không | Không |
| **Orders Manage** | `/customer/orders/manage` | `/api/orders` | ✅ Done | ✅ | ✅ | Không | P0 | Không | Không |
| **Order Create** | `/customer/orders/create` | `/api/orders` POST | ✅ Done | ✅ | ✅ | Không | P0 | Không | Không |
| **Order Detail** | `/customer/orders/[id]` | `/api/orders/[id]` | ✅ Done | ✅ | ✅ | Không | P0 | Không | Không |
| **Products** | `/customer/products` | `/api/products` | ✅ Done | ✅ | ✅ | Không | P0 | Không | Không |
| **Product Create** | `/customer/products/create` | `/api/products` POST | ✅ Done | ✅ | ✅ | Không | P0 | Không | Không |
| **Product Detail** | `/customer/products/[id]` | `/api/products/[id]` | ✅ Done | ✅ | ✅ | Không | P0 | Không | Không |
| **Inventory** | `/customer/inventory` | `/api/inventory/overview` | ✅ Done | ✅ | ✅ | Không | P0 | Không | Không |
| **POS** | `/customer/channels/pos` | `/api/pos/checkout` | ✅ Done | ✅ | ✅ | Không | P0 | Không | Không |
| **Fanpage/Chatbot** | `/customer/channels/fanpage` | `/api/chatbot/*` | ✅ Mock-Sandbox | Mock | ✅ | Cần credentials FB thật cho production | P1 | Không | ✅ FB App |
| **Livestream** | `/customer/channels/livestream` | `/api/chatbot/*` | ✅ Mock-Sandbox | Mock | ✅ | Cần credentials FB thật | P1 | Không | ✅ FB App |
| **Ecommerce** | `/customer/channels/ecommerce` | `/api/ecommerce/*` | ✅ Mock-Sandbox | Mock | ✅ | Cần Shopee/Lazada/TikTok credentials | P1 | Không | ✅ Open Platform |
| **COD Report** | `/customer/reports/cod` | `/api/reports/cod` | ✅ Done | ✅ | ✅ | Không | P0 | Không | Không |
| **Reports Overview** | `/customer/reports/overview` | `/api/reports/overview` | ✅ Done | ✅ | ✅ | Không | P0 | Không | Không |
| **Reports Orders** | `/customer/reports/orders` | `/api/reports/overview` | ✅ Done | ✅ | ✅ | Không | P0 | Không | Không |
| **Reports Index** | `/customer/reports` | — | ✅ Done | Static | ✅ | Không | P0 | Không | Không |
| **Accounting Index** | `/customer/accounting` | — | ✅ Done | Static | ✅ | Không | P1 | Không | Không |
| **Invoices** | `/customer/invoices` | `/api/invoices` | ✅ Done | ✅ | ✅ | Không | P0 | Không | Không |
| **Invoice Detail** | `/customer/invoices/[id]` | `/api/invoices/[id]` | ✅ Done | ✅ | ✅ | Không | P0 | Không | Không |
| **Invoice Print** | `/customer/invoices/print/[id]` | `/api/invoices/[id]` | ✅ Done | ✅ | ✅ | Không | P0 | Không | Không |
| **Customers** | `/customer/partners/customers` | `/api/customers` | ✅ Done | ✅ | ✅ | Không | P0 | Không | Không |
| **Blacklist** | `/customer/partners/blacklist` | `/api/customers` | ✅ Done | ✅ | ✅ | Không | P0 | Không | Không |
| **Shippers** | `/customer/partners/shippers` | `/api/shippers` | ✅ Done | ✅ | ✅ | Cần token thật để bật production mode | P1 | Không | ✅ Carrier API |
| **Settings** | `/customer/settings` | — | ⚠️ Partial | Static | ⚠️ | Chỉ là link grid, thiếu Production Readiness panel | P1 | Không | Không |
| **Tools** | `/customer/tools` | — | ⚠️ Partial | Static | ⚠️ | Thiếu Production Readiness panel | P1 | Không | Không |
| **Profile** | `/customer/profile` | `/api/auth/profile` | ✅ Done | ✅ | ✅ | Không | P0 | Không | Không |
| **Bot Settings** | `/customer/tools/bot-settings` | `/api/bot-settings` | ✅ Done | ✅ | ✅ | Không | P0 | Không | Không |
| **Channels Settings** | `/customer/channels/settings` | — | ✅ Done | ✅ | ✅ | Không | P1 | Không | Không |
| **Health Check** | `/api/health` | — | ✅ Done | ✅ | ✅ | Không | P0 | Không | Không |

---

## Kết luận phân tích

### ✅ Done — Đầy đủ, chạy thật bằng DB (24/32 modules)
Tất cả core modules: Dashboard, Orders, Products, Inventory, POS, COD, Reports, Invoices, Customers, Shippers

### ⚠️ Partial — Chạy được nhưng thiếu sót nhỏ (3 modules)
- `/customer/settings` — chỉ là link grid, thiếu Production Readiness checklist
- `/customer/tools` — thiếu Production Readiness panel
- `/admin/shops/[id]` — icons dùng chữ cái (đã fix)

### 🟡 Mock/Sandbox — Chạy được bằng mock data (3 modules)
- Fanpage/Chatbot — mock comment injection, chờ FB credentials
- Livestream — tương tự Fanpage
- Ecommerce Channels — mock sync, chờ platform credentials

### ❌ Missing API (1 item)
- `PATCH /api/shops/[id]` — toggle trạng thái shop từ Admin

---

## Credentials cần để bật Production thật

| Kênh | Cần gì |
|---|---|
| GHN | API Token + Shop ID từ GHN Merchant |
| GHTK | API Token từ GHTK Merchant |
| J&T | API Key + Customer Code |
| SPX | SPX Partner credentials |
| Facebook Chatbot | App ID, App Secret, Page Access Token, Verify Token |
| Shopee | Shopee Open Platform App Key + App Secret |
| Lazada | Lazada Open Platform App Key + App Secret |
| TikTok Shop | TikTok Shop Developer Key + App Secret |
| MISA Invoice | MISA App ID + API Key (per-shop) |
| VNPT Invoice | VNPT Partner credentials |

---

## P0/P1 Actions cần làm ngay

### P0 (Blocking)
- [x] Health check endpoint ✅
- [x] Safe logger ✅
- [x] Production admin seed ✅

### P1 (Demo/UAT)
- [x] Fix admin shop detail icons (đã fix)
- [x] Thêm `GET/PATCH /api/shops/[id]` (đã làm)
- [x] Thêm Production Readiness panel vào `/customer/settings`
- [x] Thêm Production Readiness panel vào `/customer/tools`

### P2 (Post-demo)
- Phân quyền nhân sự shop (staff/manager roles)
- Export CSV nâng cao
- Ledger kế toán chi tiết
- Webhook automation rules
