# Full UPOS Parity Checklist - Hship.vn

Audit date: 2026-05-28  
Target: parity về layout, module, flow vận hành và UX nghiệp vụ theo mô hình UPOS-like, không copy brand/logo/tài sản thương mại.

## Parity Snapshot

| Chỉ số | Ước tính hiện tại | Ghi chú |
|---|---:|---|
| UI parity | ~72% | Admin/shop core đã polish; X1 navigation có các route gốc chính cho accounting, reports, tools, settings, POS, ecommerce, product và inventory; một số màn còn cần polish sâu. |
| Functional parity | ~64% | Order, COD, carrier mock, chatbot mock và Product/SKU/Inventory tối thiểu đã chạy bằng database thật. |
| Production parity | ~36% | Chưa có Facebook production credentials, carrier production credentials, HTTPS webhook, deploy/backup/monitoring thật. |

## Full Parity Table

| Nhóm module | Module/page | Route hiện có | API hiện có | Trạng thái | Còn thiếu gì để giống web mẫu | Ưu tiên | Có cần schema không | Có cần production credentials không |
|---|---|---|---|---|---|---|---|---|
| Admin | Dashboard hệ thống | `/admin/dashboard` | `GET /api/dashboard` | Done | Drilldown sâu hơn theo thời gian/shop | P0 | Không | Không |
| Admin | Quản lý shop | `/admin/shops` | `GET/POST /api/shops` | Done | Sửa/khóa shop, phân quyền nhân sự shop | P0 | Không | Không |
| Admin | Chi tiết shop | `/admin/shops/[id]` | Dùng `/api/dashboard`, `/api/orders?shopId=` | Partial | API riêng `/api/shops/[id]`, audit, carrier usage drilldown | P1 | Không | Không |
| Admin | Audit log | Missing | Missing | Missing | Page audit log, filter user/action/entity | P1 | Đã có `AuditLog` | Không |
| Navigation/Layout | Shop sidebar/topbar | `app/customer/layout.js` | N/A | Done | Mobile collapse và permission-based menu ở phase sau | P0 | Không | Không |
| Navigation/Layout | Tổng quan | `/customer/dashboard` | `GET /api/shop/dashboard`, `GET /api/inventory/overview` | Done | Low-stock widget đã dùng inventory thật; top product vẫn cần order-item/product mapping sau | P0 | Không thêm cho X2 | Không |
| Navigation/Layout | Đơn hàng & sản phẩm | `/customer/products`, `/customer/products/create`, `/customer/products/[id]`, `/customer/orders/manage`, `/customer/orders/delivery`, `/customer/inventory`, `/customer/partners/shippers`, `/customer/appointments` | Có một phần | Partial | Product/inventory tối thiểu đã chạy thật; lịch hẹn pickup hiện là shell/empty state, chưa có domain thật | P0 | Không thêm cho X2 | Có cho pickup carrier |
| Navigation/Layout | Kênh bán hàng | `/customer/channels/fanpage`, `/customer/channels/livestream`, `/customer/channels/ecommerce`, `/customer/channels/pos` | Có một phần | Partial | Ecommerce production sync, POS inventory deduction | P1 | Có | Có cho sàn TMĐT |
| Navigation/Layout | Hóa đơn điện tử | `/customer/invoices`, `/customer/accounting`, `/customer/accounting/invoices` | `GET /api/invoices`, sync/cancel/detail | Partial | `/customer/invoices` là alias; cần detail route chuẩn, print polish, production e-invoice adapter | P1 | Không lớn | Có |
| Navigation/Layout | Báo cáo & kế toán | `/customer/accounting`, `/customer/reports`, `/customer/reports/overview`, `/customer/reports/orders`, `/customer/reports/cod` | `GET /api/reports/overview`, `GET /api/reports/cod` | Partial | Ledger/reconciliation, reports export server-side | P1 | Có cho ledger | Không |
| Navigation/Layout | Công cụ & cài đặt | `/customer/tools`, `/customer/tools/bot-settings`, `/customer/settings`, `/customer/channels/settings` | `GET/PUT /api/bot-settings`, `/api/integrations`, `/api/facebook/settings` | Partial | Notification settings, webhook diagnostics | P1 | Không | Có cho Meta |
| Orders | Tạo đơn web | `/customer/orders/create` | `POST /api/orders` | Done | Product picker sau X2 | P0 | Có cho product picker | Không |
| Orders | Quản lý đơn | `/customer/orders/manage` | `GET /api/orders`, actions confirm/push/update | Done | Server-side pagination/filter hoàn chỉnh | P0 | Không | Không |
| Orders | Chi tiết đơn/timeline | `/customer/orders/[id]` | `GET/PATCH /api/orders/[id]` | Done | Timeline UI có thể polish thêm | P0 | Không | Không |
| Orders | Returns/partial/issues | `/customer/orders/returns`, `/partial`, `/issues` | `GET /api/orders` filter client-side | Partial | Server-side filtered endpoints, actions chuẩn | P1 | Không | Không |
| Orders | Order source | Web/chatbot/POS/ecommerce field | `Order.channel` | Partial | Ecommerce production source mapping | P1 | Không | Có cho sàn |
| Product/SKU/Inventory | Product list/create/detail | `/customer/products`, `/customer/products/create`, `/customer/products/[id]` | `GET/POST /api/products`, `GET/PATCH/DELETE /api/products/[id]` | Done | Product picker trong tạo đơn và bulk import/export SKU còn thiếu | P0 | Đã có | Không |
| Product/SKU/Inventory | Inventory overview/movement | `/customer/inventory` | `GET /api/inventory/overview`, `POST /api/inventory/movements` | Done | Inventory movement ledger nâng cao và audit chi tiết ở X6/X9 | P0 | Đã có | Không |
| Product/SKU/Inventory | Low stock dashboard | `/customer/dashboard` | `GET /api/inventory/overview` | Done | Top product bán chạy cần map OrderItem -> Product ở phase sau | P1 | Đã có | Không |
| Facebook/Livestream | Fanpage chatbot | `/customer/channels/fanpage` | `/api/chatbot/*`, mock comment | Done | Production webhook + Page token thật | P0 | Không | Có |
| Facebook/Livestream | Livestream chatbot | `/customer/channels/livestream` | `/api/chatbot/*` | Done | Live comment subscription thật | P0 | Không | Có |
| Facebook/Livestream | Bot settings | `/customer/tools/bot-settings` | `GET/PUT /api/bot-settings` | Done | Áp rule vào production reply engine | P1 | Đã có | Có cho Meta |
| Facebook/Livestream | Page connection UI | `/customer/channels/settings` | `/api/integrations`, `/api/facebook/settings` | Partial | Validate token thật, webhook verify URL HTTPS | P1 | Không | Có |
| Facebook/Livestream | Webhook foundation | `/api/facebook/webhook`, `/api/webhooks/pancake` | Có | Mock-Sandbox | Meta app secret verify, retry/idempotency hardening | P1 | Không | Có |
| Carrier | Carrier config | `/customer/partners/shippers` | `GET/PUT /api/shippers`, test connection | Done | UI warning rõ khi production thiếu credentials | P0 | Không | Có |
| Carrier | Mock carrier push/events | Orders manage/detail | `/api/orders/[id]/push-carrier`, `/api/carriers/mock-event` | Mock-Sandbox | Adapter production create/cancel/tracking/status | P0 | Không | Có |
| Carrier | GHN/GHTK/J&T/SPX production | Config cards | Lib adapters một phần/mock | Mock-Sandbox | Docs/credentials chính thức, mapping fee/status/error | P1 | Không | Có |
| COD/Accounting | COD report | `/customer/reports/cod` | `GET /api/reports/cod` | Done | Server-side export và reconcile batches | P0 | Có cho ledger | Không |
| COD/Accounting | COD ledger/reconciliation | Missing | Missing | Missing | Ledger table, settlement batch, adjustment workflow | P1 | Có | Không |
| COD/Accounting | Invoice list/print | `/customer/accounting/invoices`, `/print` | `/api/invoices/*` | Partial | Detail route chuẩn, adapter hóa đơn thật | P1 | Không lớn | Có |
| POS/Ecommerce | POS order create | `/customer/channels/pos` | `POST /api/orders`, `/api/products` | Partial | POS đọc sản phẩm thật; inventory decrement và receipt print còn thiếu | P1 | Có thể thêm OrderItem product link | Không |
| POS/Ecommerce | Ecommerce channel settings | `/customer/channels/ecommerce` | Missing | Mock-Sandbox | Shopee/Lazada/Tiki/TikTok OAuth/API sync | P2 | Có thể có | Có |
| Customers/Partners | Customer list/blacklist | `/customer/clients`, `/customer/clients/blacklist` | `GET /api/customers` | Done | Customer detail/history | P1 | Có thể cần note field | Không |
| Security | Auth/session/role | Existing | Server auth helpers | Done | Rate limit, CSRF policy, production cookie policy review | P0 | Không | Không |
| Security | Token mask/encrypt | Existing | Carrier/integration APIs | Done | Secret rotation runbook | P0 | Không | Không |
| Production | ENV/deploy/runbook | Docs existing | N/A | Partial | Server/domain/SSL/backup/monitoring/log retention | P0 | Không | Có |
| Production | Tests | Build/manual UAT | N/A | Partial | Automated smoke/e2e, route click tests, API auth tests | P1 | Không | Không |

## Biggest Remaining Gaps

1. COD ledger/reconciliation is needed for accounting parity.
2. Product picker/order-item mapping and inventory decrement are still needed for order/POS parity.
3. Facebook production requires Meta App, App Secret, Page Token, HTTPS webhook and verification flow.
4. Carrier production requires official GHN/GHTK/J&T/SPX credentials/docs and non-mock adapters.
5. Audit log UI and admin drilldowns are still partial.
6. Ecommerce/POS need production channel credentials and fuller sales workflows.
