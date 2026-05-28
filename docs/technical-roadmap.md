# Technical Roadmap

Roadmap nay bat dau sau MVP mock da chay local. Muc tieu la nang he thong thanh san pham chuyen nghiep, giu Next.js monolith hien tai trong giai doan gan, chi tach service khi co ap luc scale/operation that.

## Phase B: UI/UX Polish + Demo Data Professional

Muc tieu:

- Lam ro hai portal: Admin Portal va Shop Internal Portal.
- Chuan hoa ngon ngu UI: `/customer/*` hien thi la "Shop Portal"/"Noi bo shop", khong goi nham la khach mua hang.
- Lam demo data sach, khong mojibake, co luong demo thuyet phuc.
- Giam mock/hardcode tren nhung trang demo chinh.

Viec can lam:

- Cap nhat navigation/sidebar/header text cho Admin Portal va Shop Internal Portal.
- Giu route `/customer/*`, them comment/docs ro day la legacy route.
- Polish cac route demo chinh: admin dashboard, admin shops, shop dashboard, order manage/create, fanpage/livestream, shippers.
- Chuan hoa status labels trong UI sang `draft`, `pending`, `ready_to_ship`, `pushed_to_carrier`, `shipping`, `delivered`, `partial_delivered`, `returned`, `failed`, `cancelled`.
- Sua cac page shop dang filter legacy `partial`/`issue`.
- Cap nhat shippers page de hien 4 carrier GHN/GHTK/J&T/SPX.
- Lam seed demo professional: shop, users, customer, blacklist, carrier configs, orders, chat sessions, carrier events.
- Tach seed local demo khoi data production/staging.
- Don cac trang mock cu hoac gan nhan "legacy/demo".
- Chay build/lint; sua lint runtime-critical.

Deliverables:

- UI demo san sang trinh bay cho khach.
- Demo script va sample accounts.
- Known limitations ro rang.

## Phase C: Order Domain Professional

Muc tieu:

- Bien order management tu MVP thanh domain du de van hanh.
- Tach lich su trang thai, shipment va issue/partial delivery neu can.

Viec can lam:

- Them OrderStatusHistory de audit moi lan doi status.
- Them Shipment hoac ShipmentAttempt neu mot order co the day carrier/redo/cancel.
- Chuan hoa API order detail, update, cancel, return, partial delivery.
- Them order detail page/drawer trong Shop Internal Portal.
- Them bulk action co guard: confirm, push carrier, cancel.
- Them validation product/order tot hon: phone, address, COD, item quantity, carrier eligibility.
- Them field cho partial delivery: deliveredAmount, returnedItems, collectedCodAmount neu can.
- Them Issue/Claim domain neu can quan ly kien van de rieng voi carrier.
- Viet tests cho multi-tenant order CRUD, confirm draft, carrier push, status transition.

Deliverables:

- Order domain co audit trail.
- Shop khong the lam sai status transition.
- Admin co the drill-down order cua tung shop.

## Phase D: Carrier Integration Architecture

Muc tieu:

- Nang carrier tu mock/sandbox len kien truc san sang tich hop production.

Viec can lam:

- Giu adapter interface: `calculateFee`, `createShipment`, `getShipmentStatus`, `cancelShipment`.
- Them carrier-specific credential schema/config metadata: required fields, labels, validation.
- Them `testConnection` cho moi carrier.
- Them Shipment/CarrierEvent dung chung cho webhook va polling.
- Chuan hoa idempotency key khi tao shipment va khi nhan webhook.
- Them request timeout, retry/backoff, rate limit, structured logging.
- Implement sandbox/production mode switch theo shop/carrier.
- Production adapter theo thu tu uu tien: GHN, GHTK, J&T, SPX.
- Webhook production: verify signature/secret theo tung carrier, luu raw event, map status, retry-safe.

Deliverables:

- Carrier integration module co the bat production tung carrier ma khong pha UI/API.
- Tai lieu cau hinh credential tung carrier.

## Phase E: COD/Reconciliation

Muc tieu:

- Tach COD dashboard demo thanh doi soat tien thu ho co audit.

Viec can lam:

- Them CodLedger hoac CodTransaction: pending, collecting, collected, reconciled, returned, cancelled, adjustment.
- Them ReconciliationBatch/PayoutBatch theo carrier va ky doi soat.
- Luu phi van chuyen, phi hoan, phi COD, phi phat sinh, so tien carrier chuyen ve.
- Them import statement carrier/CSV neu khach can.
- Them man hinh doi soat: filter ky, carrier, shop, status, mismatch.
- Them export Excel/PDF.
- Chuan hoa dashboard: COD pending, collected, reconciled, dispute, returned.

Deliverables:

- COD co audit trail va phuc vu doi soat that.
- Dashboard khong tinh sai voi don hoan/huy/that bai.

## Phase F: Facebook Chatbot Production Architecture

Muc tieu:

- Chuyen mock chatbot thanh kien truc production-ready, phu thuoc Meta approval va permission.

Viec can lam:

- Them FacebookPage/ChannelConnection model neu can: pageId, pageName, token encrypted, status, subscribed events.
- Them WebhookEvent/idempotency cho Meta webhook.
- Implement Meta webhook verify token, signature, retry-safe handling.
- Map comment/livestream event -> ChatSession.
- Bot script rule-based versioning: missing phone/address/size/quantity, confirm, handoff.
- Handoff cho nhan vien shop, manual reply log.
- Tao draft order tu session production tuong tu mock flow.
- Them admin/system monitoring cho webhook loi/token expired.
- Chuan bi tai lieu Meta App Review va limitation: production that khong nam trong MVP neu chua co app approval.

Deliverables:

- Kien truc chatbot co the xin Meta App Review va bat production theo tung page/shop.

## Phase G: Security/Test/Deployment

Muc tieu:

- Dua san pham tu local demo len staging/production an toan.

Viec can lam:

- Role/permission model: admin, shop_owner, shop_staff, accountant, support.
- Migration route/role legacy: `/customer` -> `/shop` alias/redirect, `customer` role -> `shop_owner`.
- AuditLog cho thao tac nhay cam: login, credential update, status update, COD reconcile.
- Secret management: key rotation, production env, no secrets in logs.
- Rate limit auth/API/webhook.
- CSRF strategy cho cookie-auth mutating APIs.
- Test suite:
  - Unit: parser, status mapping, COD calculation.
  - Integration: auth, multi-tenant, order, chatbot, carrier.
  - E2E: admin creates shop, shop creates order, chatbot draft, carrier event, dashboard COD.
- CI pipeline: lint, build, prisma validate, tests.
- Deployment guide: MySQL, env, migration, seed demo, backup/restore, monitoring.

Deliverables:

- Staging deploy checklist.
- Production readiness checklist.
- Automated regression coverage cho flow quan trong.

## De xuat thu tu gan nhat

1. Lam Phase B truoc de demo khach thuyet phuc va giam nham portal.
2. Sau khi khach chot UX/flow, lam Phase C de cung co domain order.
3. Carrier production va Facebook production tach phase rieng vi phu thuoc tai lieu/API/approval ben thu ba.

