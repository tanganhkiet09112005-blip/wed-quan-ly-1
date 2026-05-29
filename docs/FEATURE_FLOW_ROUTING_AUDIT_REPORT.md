# PRODUCTION AUDIT REPORT: FLOW ROUTING (PHÂN LUỒNG ĐƠN HÀNG)

**Date**: 2026-05-29
**Status**: READY FOR PRODUCTION MIGRATION
**Environment Context**: `banhang.upos.vn` parity

## 1. Mục tiêu Audit
Xác nhận tính năng "Phân luồng đơn hàng tự động" (Order Flow Routing) đã được tích hợp hoàn chỉnh vào hệ thống Hship.vn, đảm bảo không phá vỡ logic cũ (Admin/Shop, Bảng giá) và đáp ứng yêu cầu nghiệp vụ khắt khe của dự án.

## 2. Kết quả Audit Tổng Quan
- **Prisma Schema**: Đã được update và generate thành công (`OrderFlowRule`, `OrderFlowLog`, `flowStatus`...).
- **Flow Engine**: Logic phân luồng tĩnh (`flow-engine.js`) đã chạy, bao gồm kiểm tra Blacklist, Missing Credentials, Missing Pricing, và Evaluate Rules động.
- **REST APIs**: Đã hoàn thành các endpoint `GET/POST/PATCH/DELETE` cho `OrderFlowRule`, endpoint `approve`, endpoint `push-carrier`.
- **UI Admin/Shop**: Đã tích hợp màn hình quản lý Rule, thêm badge trạng thái luồng vào danh sách đơn, và hỗ trợ các nút thao tác `Duyệt`, `Đẩy vận chuyển` với các guard phía backend.

## 3. Chi tiết các hạng mục đã hoàn thành

### 3.1 Cơ sở dữ liệu (Database Layer)
- [x] Tạo model `OrderFlowRule` để lưu cấu hình rule cho từng Shop (Priority, Condition, Action).
- [x] Tạo model `OrderFlowLog` để tracking quá trình luân chuyển luồng.
- [x] Bổ sung column `flowStatus`, `flowMessage`, `flowRuleId`, `carrierCode`, `pushError`, `pushedAt` vào `Order`.
- [x] Bổ sung column `autoPushCarrierEnabled` vào `Shop`.
- [x] Tạo file Migration SQL an toàn (chỉ ADD, không DROP).

### 3.2 Core Logic Engine (Backend)
- [x] Tạo service `determineOrderFlow` độc lập.
- [x] Thứ tự evaluate: 
  1. `BLACKLIST` check.
  2. `PRICING_MISSING` check (nếu shop có bảng giá mà đơn không có `weight`).
  3. `MISSING_CREDENTIALS` check (kiểm tra `shopShipper`).
  4. Custom Rules từ `OrderFlowRule`.
  5. Default: `WAITING_APPROVAL`.
- [x] Refactor `POST /api/orders` để sử dụng `determineOrderFlow` thay vì auto-push cứng nhắc.
- [x] Chỉ auto-push khi `flowStatus === 'READY_TO_PUSH'` AND `shop.autoPushCarrierEnabled === true`.

### 3.3 Authorization & RBAC
- [x] Admin tổng: Có toàn quyền quản lý Rule, Duyệt đơn, Push đơn cho tất cả Shop.
- [x] Admin con: Có toàn quyền trên các Shop do mình quản lý.
- [x] Shop: Chỉ được thao tác tạo đơn, xem trạng thái luồng. KHÔNG được duyệt luồng (`approve`), KHÔNG được thay đổi Rule (`flow-rules`), KHÔNG được đẩy trực tiếp (`push-carrier`). Frontend chỉ ẩn UI và Backend đã bảo vệ cứng.

### 3.4 UI & UX (Frontend)
- [x] Bổ sung nút `Phân luồng` vào bảng danh sách Shop trong Admin Portal.
- [x] Màn hình `/admin/shops/[id]/flow-rules` hỗ trợ CRUD cấu hình luồng đơn giản, dễ hiểu với giao diện giống bảng giá.
- [x] Badge hiển thị trạng thái Flow rõ ràng tại `/admin/orders/manage` và `/customer/orders/manage`.
- [x] Nút "Duyệt đơn", "Đẩy vận chuyển" hiển thị tương ứng với `flowStatus`.
- [x] Các Toast notification cảnh báo rõ ràng khi tạo đơn (VD: Thiếu API vận chuyển, chờ duyệt, v.v.).

## 4. Các rủi ro đã được mitigate
- **Khách hàng không điền cân nặng**: Frontend validate chặt chẽ. Backend sẽ gán `PRICING_MISSING` nếu thiếu.
- **Admin quên gắn Rule**: Engine tự fallback về `WAITING_APPROVAL` (an toàn, không mất đơn).
- **Auto-push cũ bị lỗi**: Đã ẩn đằng sau cờ `Shop.autoPushCarrierEnabled`, default là `false`. Chuyển dịch về workflow duyệt/kiểm soát hoàn toàn.
- **Dữ liệu cũ (Backward compatibility)**: Đơn cũ không có `flowStatus` sẽ fallback xuống trạng thái render "Chưa phân luồng". Backend check Nullable type ok. Không bị crash app.

## 5. Kết luận & Hành động tiếp theo
Hệ thống ĐẠT chuẩn production. Core Flow Routing ổn định, sẵn sàng để deploy. 

**Next Steps (Dành cho DevOps/Deployer):**
1. Review migration file: `prisma/migrations/add_order_flow_routing.sql`
2. Chạy `npx prisma db push` hoặc chạy script migration trên DB Staging/Production.
3. Reload/Restart server để nạp tính năng mới.
4. Bàn giao tài liệu và báo cáo cho khách hàng ký nghiệm thu.
