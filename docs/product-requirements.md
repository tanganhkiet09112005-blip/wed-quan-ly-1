# Product Requirements

## 1. Mo ta san pham

Hship.vn la he thong quan ly don hang da shop theo mo hinh SaaS tuong tu UPOS/banhang.upos.vn. San pham phuc vu hai nhom nguoi dung rieng:

- Super admin/doi van hanh nen tang quan ly nhieu shop, tai khoan, trang thai va bao cao tong hop.
- Shop/don vi ban hang dang nhap vao trang noi bo rieng de tao don, xu ly don, cau hinh don vi van chuyen, theo doi COD va van hanh chatbot/livestream.

Source hien tai dang dung route `/customer/*` cho portal cua shop. Ve mat san pham, day phai duoc hieu va trinh bay la Shop Internal Portal/Trang noi bo shop, khong phai trang danh cho khach mua hang. Viec doi route `/customer` thanh `/shop` nen tach thanh phase migration rieng de tranh gay vo route, auth va lien ket UI.

## 2. Admin Portal

Route hien tai: `/admin/*`.

Nguoi dung: super admin hoac nhan su van hanh nen tang Hship.vn.

Muc tieu: quan tri he thong da shop, khong phai man hinh van hanh don hang hang ngay cua tung shop.

Module bat buoc:

- Dashboard he thong: tong shop, tong don, COD, cuoc phi, trang thai don, carrier usage.
- Quan ly shop: tao shop, tao user shop, sua thong tin shop, khoa/mo shop.
- Chi tiet shop: thong tin shop, danh sach user, carrier dang dung, thong ke don, COD, cuoc phi.
- Bao cao tong hop: theo thoi gian, theo shop, theo carrier, theo trang thai.
- Quan ly cau hinh nen tang: danh sach carrier ho tro, adapter, cau hinh webhook/system env.
- Giam sat tich hop: webhook carrier, Facebook/Pancake event, loi dong bo.

Admin co the xem du lieu tong hoac filter theo shop de ho tro/kiem tra, nhung cac luong tao don, xu ly livestream, day don hằng ngay thuoc Shop Internal Portal.

## 3. Shop Internal Portal

Route hien tai: `/customer/*`.

Nguoi dung: chu shop, nhan vien shop, CSKH, nhan su livestream, nhan su doi soat.

Muc tieu: van hanh don hang hằng ngay cua tung shop, du lieu bat buoc duoc scope theo `shopId` cua session.

Module bat buoc:

- Dashboard shop: tong don, don dang xu ly, COD pending/collected, cuoc phi, don theo trang thai, don theo carrier.
- Tao don giao hang: nhap nguoi nhan, SDT, dia chi, san pham, so luong, COD, carrier.
- Quan ly don hang: draft, pending, ready_to_ship, pushed_to_carrier, shipping, delivered, partial_delivered, returned, failed, cancelled.
- Don giao hang: danh sach don dang giao/co tracking.
- Don tra hang: don returned, ly do, tracking, COD returned.
- Ky nhan mot phan: don partial_delivered, COD collecting/collected theo quy tac da chot.
- Kien van de: don failed/issue, ghi chu, carrier event lien quan.
- Quan ly COD: pending, collecting, collected, reconciled, returned, cancelled.
- Khach hang: ho so khach, so don, lien ket don theo SDT trong tung shop.
- Khach bom hang: blacklist rieng theo shop, canh bao khi tao don.
- Don vi van chuyen: GHN, GHTK, J&T, SPX; bat/tat carrier; luu API key/token theo tung shop.
- Fanpage/Livestream chatbot: comment -> bot hoi thong tin -> tao don nhap -> shop xac nhan -> day carrier.

## 4. Luong nghiep vu chinh

### 4.1 Admin tao shop

1. Admin dang nhap `/admin`.
2. Admin mo Quan ly shop.
3. Admin nhap ma shop, ten shop, chu shop, email, SDT, mat khau khoi tao, trang thai.
4. He thong tao `Shop`, user shop, `ShopConfig` mac dinh.
5. Shop dang nhap vao Shop Internal Portal bang tai khoan vua tao.

Acceptance criteria:

- Chi admin moi tao/sua/khoa shop.
- Email va ma shop khong trung.
- Password luu hash.
- Shop inactive khong dang nhap/khong truy cap du lieu.
- Admin dashboard cap nhat so shop va thong ke shop moi.

### 4.2 Shop tao don

1. Shop dang nhap.
2. Mo Tao don giao hang.
3. Nhap nguoi nhan, SDT, dia chi, san pham, so luong, COD.
4. Chon carrier neu muon day ngay.
5. He thong tao/link `Customer` theo SDT trong dung shop.
6. He thong tao `Order` thuoc shop hien tai.

Acceptance criteria:

- Shop khong truyen/khong override duoc `shopId` cua shop khac.
- Bat buoc co ten nguoi nhan, SDT, dia chi, it nhat mot san pham, so luong > 0.
- Neu SDT da ton tai trong shop thi link customer hien co.
- Neu SDT nam blacklist cua shop thi UI canh bao truoc khi tao don.
- Order code khong dung `count()` de tranh trung khi concurrent.

### 4.3 Chatbot/Livestream bat don

1. Shop mo Fanpage hoac Livestream.
2. He thong nhan comment mock/production event.
3. Parser/bot lay SDT, dia chi, size, so luong, san pham.
4. Neu thieu thong tin, bot hoi tiep.
5. Neu du thong tin, shop bam tao don nhap.
6. He thong tao `Order` status `draft` va link `ChatSession`.

Acceptance criteria:

- Session/comment thuoc dung shop.
- Shop khac khong xem/sua session.
- Parser khong crash voi message rong/null.
- Draft chi duoc tao khi du phone, address, product, quantity.
- Draft order xuat hien trong Quan ly don hang.

### 4.4 Confirm order

1. Shop xem order `draft`.
2. Shop bam Xac nhan.
3. He thong doi status sang `pending` hoac `ready_to_ship`.

Acceptance criteria:

- Chi order `draft` moi duoc confirm.
- Chi shop so huu order hoac admin duoc confirm.
- Khong confirm duoc order cua shop khac.
- ChatSession link draft duoc cap nhat status `confirmed`.

### 4.5 Day carrier

1. Shop chon carrier GHN/GHTK/J&T/SPX.
2. He thong kiem tra carrier dang active va co credential.
3. Adapter carrier tao shipment mock/production.
4. He thong luu carrier code/name, trackingCode, shippingFee, carrierFee.
5. Order sang `pushed_to_carrier` hoac `shipping`.

Acceptance criteria:

- Token/API key khong tra raw ve frontend.
- Credentials luu ma hoa bang `ENCRYPTION_KEY`.
- Moi carrier co adapter chung: `calculateFee`, `createShipment`, `getShipmentStatus`, `cancelShipment`.
- Shop khac khong day duoc order cua shop hien tai.

### 4.6 Cap nhat van don va COD

1. Carrier gui webhook hoac shop dung mock event.
2. He thong map carrier status sang order status.
3. He thong cap nhat COD status theo order status.
4. Dashboard shop/admin tinh lai so lieu.

Acceptance criteria:

- `delivered` -> COD `collected`, set `codCollectedAt` neu `codAmount > 0`.
- `partial_delivered` -> COD `collecting` trong MVP.
- `returned` va `failed` -> COD `returned`.
- `cancelled` -> COD `cancelled`.
- COD cua returned/failed/cancelled khong tinh vao collected.
- Carrier event duoc luu de audit.

## 5. Module acceptance criteria tong quat

### Auth va phan quyen

- Auth dung httpOnly cookie/session.
- API bat buoc verify server-side, khong tin localStorage.
- Role `admin` truy cap Admin Portal; role shop/staff truy cap Shop Internal Portal.
- Ten role `customer` hien tai nen duoc xem la legacy shop user.

### Multi-tenant

- Moi bang nghiep vu shop-level phai co `shopId` hoac lien ket ve shop.
- Moi query shop user phai scope theo session.
- Admin duoc xem tong hoac filter theo shop.
- Test bat buoc co case shop A khong doc/sua duoc du lieu shop B.

### Carrier

- Giai doan demo dung mock/sandbox.
- Giai doan production tach adapter theo carrier va moi adapter co test rieng.
- Webhook production phai verify signature/secret theo tung carrier.

### Facebook/Chatbot

- Giai doan demo dung mock comment.
- Production can webhook Meta, page token, app review, permission, retry/idempotency.
- Tin nhan khach va bot phai co audit log theo session.

### COD

- MVP duoc tinh tu Order.
- Production can ledger/reconciliation rieng neu can doi soat tien ve ngan hang, doi soat carrier, phi phat sinh.

