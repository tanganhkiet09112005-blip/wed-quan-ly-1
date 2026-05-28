# Current Gap Analysis

## 1. Tong quan source hien tai

Cong nghe:

- Next.js 16.2.6 App Router, React 19.2.4.
- Backend nam trong `app/api/*`.
- Prisma 5.22.0 voi MySQL/MariaDB.
- Auth dung password hash `crypto.scrypt`, signed httpOnly cookie.
- Local verification da pass cho migrate, seed, build, login, dashboard, order, chatbot mock, carrier mock va COD dashboard.

Module da co:

- `app/admin/*`: Admin Portal co dashboard va quan ly shop o muc nen tang.
- `app/customer/*`: dang la Shop Internal Portal, gom dashboard shop, order, COD, customer, blacklist, shippers, fanpage/livestream mock.
- `app/api/orders`, `app/api/customers`, `app/api/shippers`, `app/api/dashboard`, `app/api/shop/dashboard`: API DB-backed cho core MVP.
- `app/api/chatbot/*`: ChatSession/ChatMessage mock, tao draft order, reply, confirm draft.
- `app/api/carriers/mock-event`: mock carrier event va cap nhat order/COD.
- `lib/carriers/*`: adapter mock GHN, GHTK, J&T, SPX.
- `prisma/schema.prisma`: co model Shop, User, Customer, Order, OrderItem, ShopShipper, ChatSession, ChatMessage, CarrierEvent.

## 2. Nhung diem hien tai da dung

- Da co separation route co ban: `/admin/*` cho super admin, `/customer/*` cho shop portal.
- `/admin/shops` dung dung vai tro Admin Portal: tao tai khoan shop va xem tong hop shop.
- `/customer/*` phu hop Shop Internal Portal ve luong van hanh hằng ngay, du route tao don, quan ly don, carrier, fanpage/livestream, COD.
- Auth khong con la localStorage demo; API co helper phan quyen server-side.
- Multi-tenant da duoc ap dung cho API chinh: orders, customers, shippers, shop dashboard, chatbot, carrier event.
- Token/API key carrier duoc ma hoa va mask khi tra ve frontend.
- Order status MVP da co: draft, pending, ready_to_ship, pushed_to_carrier, shipping, delivered, partial_delivered, returned, failed, cancelled.
- Chatbot mock da co luong comment -> ChatSession/ChatMessage -> draft order -> confirm order.
- Carrier mock da co push shipment va mock event shipping/delivered/returned/cancelled.
- Dashboard admin/shop da tinh COD collected/pending, shipping fee, order by status/carrier tu DB.

## 3. Nhung diem con so sai hoac gay nham

### 3.1 Ten route va role

- Route `/customer/*` dang dung cho shop noi bo. Ve san pham can goi la Shop Internal Portal/Trang noi bo shop.
- Role shop trong DB/code dang la `customer`, vi du `User.role = "customer"` va `CustomerLayout` yeu cau `user.role !== 'customer'`. Day la legacy naming, de gay nham voi khach mua hang.
- `lib/mock-data.js` co `currentUser.customer` voi ten "khach", de gay nham neu con duoc dung.

Tac dong:

- Developer moi de hieu sai `/customer` la trang khach mua hang.
- Tai lieu ban giao/bao gia co nguy co mo ta sai portal.

Khuyen nghi:

- Ngan han: giu route, doi text/docs sang Shop Internal Portal.
- Trung han: migration phase doi role `customer` -> `shop_owner`/`shop_staff`, route alias `/shop/*`.

### 3.2 Admin Portal con mong

- `app/admin/layout.js` chi co navigation Dashboard he thong va Quan ly Shop.
- Nhieu trang `/admin/orders/*`, `/admin/channels/*`, `/admin/partners/*`, `/admin/reports/cod` ton tai trong source nhung khong nam trong nav admin chinh.
- Mot so trang admin con dung mock/hardcode tu `lib/mock-data.js`, vi du admin livestream, admin order delivery/returns/partial/issues, admin blacklist.

Tac dong:

- Admin Portal chua du professional de drill-down tung shop.
- De nham rang admin la man hinh van hanh don hang hang ngay.

Khuyen nghi:

- Admin Portal nen tap trung dashboard he thong, shop management, shop detail, reports, system monitoring.
- Neu admin can xem order, nen co context "Xem du lieu shop" va filter shop ro rang.

### 3.3 Shop Internal Portal con can polish

- `app/customer/dashboard/page.js` con `STATUS_MAP` legacy `issue`, `partial`; trong khi normalize status moi la `failed`, `partial_delivered`.
- `app/customer/orders/partial/page.js` goi `useShopOrders({ status: 'partial' })`; nen chuyen sang `partial_delivered`.
- `app/customer/orders/issues/page.js` goi `useShopOrders({ status: 'issue' })`; nen chuyen sang `failed` hoac bo sung issue domain rieng.
- `app/customer/orders/manage/page.js` da co core action nhung UI con demo: button `Cap nhat`, `Day DVVC`, `Mock` can label/trang thai ro hon cho ban demo/professional.
- `app/customer/channels/fanpage/page.js` van hien bang PancakeLog cu song song voi MockChatbotPanel; can quy chuan mot luong chinh.
- `app/customer/partners/shippers/page.js` co modal "Them doi tac" noi chi 3 carrier, trong khi he thong co 4 carrier GHN/GHTK/JT/SPX.

### 3.4 Domain order chua chuyen nghiep

- Order hien luu nhieu field shipping/COD/carrier tren mot bang `Order`, du MVP nhung chua du production cho shipment lifecycle.
- Chua co model Shipment rieng, ShipmentPackage, OrderStatusHistory, CodTransaction/CodLedger.
- Partial delivery chi co status, chua co so tien COD thuc thu/so luong nhan mot phan.
- Issue/complaint chua co domain rieng, dang map vao status `failed` hoac trang mock.
- Chua co workflow lock/huy/dieu chinh sau khi day carrier.

### 3.5 COD/Reconciliation con MVP

- Dashboard COD tinh tu Order summary, du demo.
- `/api/reports/cod` van dung logic cu dua vao `status` thay vi `codStatus` normalized, con nhan `issue`.
- Chua co doi soat carrier -> shop -> bank, batch payout, phi hoan, phi phat sinh, reconcile history.

### 3.6 Carrier integration con mock

- Adapter interface mock da co, nhung production chua co request signing, retry, timeout, rate limit, idempotency.
- Webhook production cu `/api/webhooks/ghn`, `/api/webhooks/ghtk`, `/api/webhooks/jt` chua dong bo hoan toan voi `CarrierEvent` service va chua co verify signature day du.
- Chua co SPX production webhook route.
- Chua co carrier credential schema rieng theo tung carrier; hien `apiKey/apiToken` la field generic.

### 3.7 Facebook/chatbot con mock

- Parser rule-based da co, phu hop demo.
- Chua co Meta webhook verify, app review, page subscription, token refresh, webhook retry/idempotency.
- Chua co inbox/comment private reply production.
- Chua co bot script/versioning, handoff cho nhan vien, log loi gui tin.

### 3.8 Seed/demo data

- Seed data co tieng Viet bi mojibake trong source text o nhieu chuoi.
- Seed script co cleanup database bang deleteMany nhieu bang. Chap nhan cho local demo, khong dung cho staging/production.
- Demo data chua du "professional": chua co shop detail day du, carrier configs day du cho moi shop, status distribution co chu dich, event history.

### 3.9 Lint/test/deployment

- `npm run build` pass.
- `npm run lint` con fail cac loi cu: `react-hooks/set-state-in-effect`, `react/no-unescaped-entities`.
- Chua co automated tests cho auth, multi-tenant, order, chatbot, carrier, COD.
- Chua co deployment guide va env checklist cho staging/production.

## 4. Bang map UI/navigation hien tai

| Route | Portal dung | Trang thai hien tai | Ghi chu |
| --- | --- | --- | --- |
| `/admin/dashboard` | Admin Portal | Dung huong | Dashboard he thong tu DB, can polish KPI/report. |
| `/admin/shops` | Admin Portal | Dung huong | Tao shop va tong hop shop, can them detail/edit/lock. |
| `/customer/dashboard` | Shop Internal Portal | Dung huong nhung ten route legacy | Can doi wording thanh "Trang noi bo shop"; update status labels. |
| `/customer/orders/manage` | Shop Internal Portal | Core MVP dung | Can polish thao tac, detail drawer, history, bulk action. |
| `/customer/orders/create` | Shop Internal Portal | Core MVP dung | Can polish validation, blacklist warning, carrier fee preview. |
| `/customer/channels/fanpage` | Shop Internal Portal | Co mock chatbot | Con song song PancakeLog cu; can quy chuan luong chatbot. |
| `/customer/channels/livestream` | Shop Internal Portal | Co mock chatbot | Dang ro la mock, can them session/live management sau. |
| `/customer/partners/shippers` | Shop Internal Portal | Dung huong | Can update text 4 carrier, credential UX, test connection. |

Trang/text gay nham:

- `/customer/*` route name va `CustomerLayout` ten component.
- Role `customer` trong schema/seed/auth.
- `lib/mock-data.js` va cac trang admin/customer con import mock data.
- Cac label "Cua hang", "Customer" trong code khong sai voi UI, nhung can thong nhat la shop portal trong docs va text san pham.

## 5. Phan can nang cap de giong he thong chuyen nghiep

Can nang cap:

- Admin shop detail: view shop, users, carriers, orders, COD, webhook health.
- Shop order management: detail page/drawer, status history, carrier event history, shipment info.
- COD reconciliation: ledger/batch payout.
- Carrier production adapter architecture.
- Facebook production architecture.
- UI text/encoding/demo data polish.
- Test suite va deploy guide.

Can viet moi:

- Shipment/ShipmentEvent neu can production lifecycle.
- OrderStatusHistory.
- CodLedger/CodReconciliationBatch.
- FacebookPage/LiveSession/WebhookEvent neu production.
- AuditLog/SecurityLog.
- Staff roles/permissions for shop team.

## 6. Rui ro ky thuat/production

- Ten role/route legacy gay nham domain va de code sai phan quyen.
- Neu production ma chi dung `Order` de tinh COD thi doi soat thuc te se kho audit.
- Carrier production co nhieu khac biet API, retry va callback; mock hien tai khong dai dien day du.
- Facebook production phu thuoc Meta App Review, permission va policy.
- Luu token da ma hoa nhung can key rotation, access logging va secret management production.
- Seed script co destructive cleanup, phai tach local seed va staging/prod migration.
- Lint debt co the che loi UI/hook that trong qua trinh nang cap.

