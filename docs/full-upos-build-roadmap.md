# Full UPOS Build Roadmap - Hship.vn

Roadmap date: 2026-05-28  
Principle: continue from the current source, keep Hship.vn branding, do not copy UPOS commercial assets, and do not call mock/sandbox behavior production.

## Phase Status

| Phase | Scope | Current status | Exit criteria |
|---|---|---|---|
| X0 | Full parity audit | Done | Checklist and roadmap reflect real source state, gaps, schema needs and credential needs. |
| X1 | Navigation/Layout parity | Mostly complete / needs QA | Sidebar has all required groups, no dead links from visible menu, missing route shells have professional pages. |
| X2 | Product/SKU/Inventory | Done - minimal functional parity | Product/ProductVariant/InventoryMovement schema, migration, seed demo products for 3 shops, product CRUD, inventory adjustment, low-stock widget. |
| X3 | Order domain full | Partial | Server pagination/filter, detail polish, returns/partial/issues actions, source-specific reporting. |
| X4 | Facebook/Livestream full | Partial/Mock | BotSettings applied, page connection UI polished, webhook foundation production-safe but blocked without Meta credentials. |
| X5 | Carrier full | Mock-Sandbox | Explicit mock/sandbox/production modes, production adapters do not fake success, cancel/tracking/status flows. |
| X6 | COD/Accounting/Reports | Partial | COD ledger, reconciliation batches, server export CSV, accounting pages with real data. |
| X7 | POS/Ecommerce/Invoice | Partial | POS creates orders with inventory decrement, ecommerce settings, invoice detail/print production polish. |
| X8 | Admin full | Partial | Shop detail, audit log, carrier usage per shop, COD/order drilldowns. |
| X9 | Production hardening | Partial docs | README production, ENV checks, logging, backup, monitoring, rate limit, smoke/e2e tests. |

## Immediate Plan

### X1 - Navigation/Layout Parity

1. Verify Shop Portal sidebar grouping against the requested IA and adjust labels only where needed: Tổng quan, Đơn hàng & sản phẩm, Kênh bán hàng, Hóa đơn điện tử, Báo cáo & Kế toán, Công cụ bổ trợ, Cài đặt.
2. Visible menu routes currently resolve, including `/customer/accounting`, `/customer/reports/orders`, `/customer/tools`, and `/customer/settings`; keep smoke testing these after any layout change.
3. Remaining X1 cleanup candidates:
   - Product detail/edit route is now implemented at `/customer/products/[id]`.
   - `/customer/appointments` currently exists as a professional empty state; add pickup domain data only after carrier/pickup scope is approved.
   - `/customer/invoices` currently exists as an alias to `/customer/accounting/invoices`; keep or remove based on final IA preference.
4. Keep `GET/PUT /api/bot-settings` in the tools flow and verify it applies to bot behavior in X4.
5. Product schema has now landed in X2; product/inventory APIs should return database data, not 501.

### X2 - Product/SKU/Inventory

1. Add Prisma models:
   - `Product`
   - `ProductVariant`
   - optionally `InventoryMovement` if stock adjustment is included.
2. Add relations to `Shop` and optionally nullable product links to `OrderItem`.
3. Create migration and update seed for 3 demo shops.
4. Make `/api/products` and `/api/inventory/overview` fully functional.
5. Connect POS product picker and dashboard low-stock widget to real data.
6. Run `npx prisma migrate dev`, `npx prisma generate`, seed, and full build.

### X3 - Order Domain Full

1. Add server-side pagination/filter/search to `/api/orders`.
2. Add explicit actions for cancel/edit/returns/partial/issues.
3. Add order source filter and reporting for web/chatbot/POS/ecommerce.
4. Polish timeline and operational detail view.

### X4 - Facebook/Livestream Full

1. Polish Page connection UI with production credential validation.
2. Keep mock mode available and clearly labeled.
3. Add webhook verification requirements for HTTPS domain and Meta app secret.
4. Apply BotSettings to actual reply behavior.

### X5 - Carrier Full

1. Define adapter contract: test connection, create shipment, cancel shipment, get tracking, map status.
2. GHN first, then GHTK, J&T, SPX.
3. Production mode must not fake success if credentials/docs are missing.

### X6 - COD/Accounting/Reports

1. Add COD ledger and reconciliation batch schema.
2. Build reconciliation UI and CSV export.
3. Expand reports for order, shipping, carrier and accounting views.

### X7 - POS/Ecommerce/Invoice

1. POS checkout uses product catalog and decrements inventory.
2. Ecommerce channel settings store credentials/mode per platform.
3. Invoice detail/print route is production-grade and connected to accounting flow.

### X8 - Admin Full

1. Dedicated shop detail API.
2. Audit log page with filters.
3. Carrier usage per shop and COD/order drilldowns.

### X9 - Production Hardening

1. Add production README and ENV validation.
2. Add backup/restore runbook for MySQL/MariaDB.
3. Add rate limiting and structured logging.
4. Add smoke tests for login and critical routes.

## Recommended Next Approval

Approve X3 Order Domain Full next if the priority is shipping/order operations, because products now exist but orders still store item names as text. Choose POS/Ecommerce basic first only if the client wants in-counter selling and marketplace demos before deeper order workflows.
