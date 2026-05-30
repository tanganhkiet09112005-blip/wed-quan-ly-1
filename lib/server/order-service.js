import crypto from 'crypto';
import {
  COD_STATUSES,
  ORDER_STATUSES,
  getOrderSourceLabel,
  getStatusLabel,
  getCodStatusForOrderStatus,
  normalizeCodStatus,
  normalizeOrderForResponse,
  normalizeOrderStatus,
} from '@/lib/order-constants';

export function normalizePhone(phone) {
  return String(phone || '').replace(/\s+/g, '').trim();
}

export function validateOrderPayload(body) {
  const errors = {};
  const codAmount = body.codAmount === undefined || body.codAmount === ''
    ? null
    : Number(body.codAmount);

  if (!body.shippingName?.trim()) errors.shippingName = 'Ten nguoi nhan la bat buoc.';
  if (!normalizePhone(body.shippingPhone)) errors.shippingPhone = 'So dien thoai nguoi nhan la bat buoc.';
  if (!body.shippingAddress?.trim()) errors.shippingAddress = 'Dia chi giao hang la bat buoc.';
  if (codAmount !== null && (!Number.isFinite(codAmount) || codAmount < 0)) {
    errors.codAmount = 'COD khong hop le.';
  }
  
  if (body.goodsContent && body.goodsContent.length > 500) {
    errors.goodsContent = 'Noi dung hang hoa khong duoc vuot qua 500 ky tu.';
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.items = 'Don hang can it nhat mot san pham.';
  } else {
    body.items.forEach((item, index) => {
      if (!item.name?.trim() && !item.variantId) errors[`items.${index}.name`] = 'Ten san pham hoac SKU la bat buoc.';
      if (!Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0) {
        errors[`items.${index}.quantity`] = 'So luong phai lon hon 0.';
      }
      const unitPrice = item.unitPrice ?? item.price;
      if (!item.variantId && (!Number.isFinite(Number(unitPrice)) || Number(unitPrice) < 0)) {
        errors[`items.${index}.price`] = 'Don gia khong hop le.';
      }
    });
  }

  if (body.status && !ORDER_STATUSES.includes(normalizeOrderStatus(body.status))) {
    errors.status = 'Trang thai don hang khong hop le.';
  }
  if (body.codStatus && !COD_STATUSES.includes(normalizeCodStatus(body.codStatus))) {
    errors.codStatus = 'Trang thai COD khong hop le.';
  }

  return errors;
}

export function normalizeOrderItems(items = []) {
  return items.map((item) => ({
    name: item.name.trim(),
    quantity: Number(item.quantity),
    price: Number(item.unitPrice ?? item.price),
    unitPrice: Number(item.unitPrice ?? item.price),
    lineTotal: Number(item.unitPrice ?? item.price) * Number(item.quantity),
    sku: item.sku || null,
    productId: item.productId || null,
    variantId: item.variantId || null,
    productCode: item.productCode || null,
    productName: item.productName || null,
    variantName: item.variantName || null,
    size: item.size || null,
    color: item.color || null,
  }));
}

export function calculateOrderTotal(items = []) {
  return items.reduce((sum, item) => sum + Number(item.unitPrice ?? item.price ?? 0) * Number(item.quantity || 0), 0);
}

function randomSuffix(bytes = 3) {
  return crypto.randomBytes(bytes).toString('hex').toUpperCase();
}

export function generateOrderCode() {
  return `DH${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${Date.now().toString(36).toUpperCase()}${randomSuffix(2)}`;
}

export function generateCustomerCode() {
  return `KH${Date.now().toString(36).toUpperCase()}${randomSuffix(2)}`;
}

export function getOrderInclude(userIsAdmin = false) {
  const include = {
    items: {
      include: {
        product: { select: { id: true, code: true, name: true } },
        variant: { select: { id: true, sku: true, name: true, size: true, color: true, price: true, stockQuantity: true } },
      },
    },
    customer: true,
    shipper: { select: { code: true, name: true } },
    chatSession: {
      select: {
        id: true,
        channel: true,
        customerName: true,
        customerPhone: true,
        productName: true,
        size: true,
        quantity: true,
        status: true,
        rawComment: true,
        createdAt: true,
        updatedAt: true,
      },
    },
  };
  if (userIsAdmin) include.shop = { include: { admin: { select: { name: true } } } };
  return include;
}

export function normalizeOrdersForResponse(orders) {
  return orders.map((order) => normalizeOrderForResponse(order));
}

export async function resolveOrderCustomer(tx, shopId, body) {
  if (!shopId) return null;

  if (body.customerId) {
    const customer = await tx.customer.findUnique({
      where: { id: body.customerId },
      select: { id: true, shopId: true },
    });
    if (!customer || customer.shopId !== shopId) {
      return { error: 'Khach hang khong thuoc shop hien tai.' };
    }
    return { customerId: customer.id };
  }

  const phone = normalizePhone(body.shippingPhone);
  if (!phone) return { customerId: null };

  const existing = await tx.customer.findUnique({
    where: {
      shopId_phone: {
        shopId,
        phone,
      },
    },
    select: { id: true },
  });
  if (existing) return { customerId: existing.id };

  const customer = await tx.customer.create({
    data: {
      code: generateCustomerCode(),
      name: body.shippingName.trim(),
      phone,
      address: body.shippingAddress.trim(),
      status: 'active',
      shopId,
    },
    select: { id: true },
  });
  return { customerId: customer.id };
}

function variantLabel(variant) {
  return [variant.size, variant.color, variant.name].filter(Boolean).join(' / ') || null;
}

export async function resolveOrderItems(tx, shopId, rawItems = [], options = {}) {
  const { requireStock = false } = options;
  const items = [];

  for (let index = 0; index < rawItems.length; index += 1) {
    const raw = rawItems[index] || {};
    const quantity = Number(raw.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return { error: `So luong san pham dong ${index + 1} khong hop le.` };
    }

    if (raw.variantId) {
      const variant = await tx.productVariant.findFirst({
        where: {
          id: raw.variantId,
          shopId,
          status: 'active',
        },
        include: {
          product: {
            select: {
              id: true,
              code: true,
              name: true,
              status: true,
            },
          },
        },
      });

      if (!variant || !variant.product || variant.product.status !== 'active') {
        return { error: 'SKU khong thuoc shop hien tai hoac dang ngung ban.' };
      }
      if (requireStock && variant.stockQuantity < quantity) {
        return { error: `SKU ${variant.sku} chi con ${variant.stockQuantity}, khong du de tao don ${quantity} san pham.` };
      }

      const unitPrice = Number(variant.price || 0);
      const label = variantLabel(variant);
      const itemName = raw.name?.trim() || [variant.product.name, label].filter(Boolean).join(' - ');

      items.push({
        name: itemName,
        quantity,
        price: unitPrice,
        unitPrice,
        lineTotal: unitPrice * quantity,
        sku: variant.sku,
        productCode: variant.product.code,
        productName: variant.product.name,
        variantName: variant.name || label,
        size: variant.size,
        color: variant.color,
        productId: variant.productId,
        variantId: variant.id,
      });
      continue;
    }

    const name = raw.name?.trim();
    const unitPrice = Number(raw.unitPrice ?? raw.price);
    if (!name) return { error: `Ten san pham dong ${index + 1} la bat buoc.` };
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return { error: `Don gia dong ${index + 1} khong hop le.` };
    }

    items.push({
      name,
      quantity,
      price: unitPrice,
      unitPrice,
      lineTotal: unitPrice * quantity,
      sku: raw.sku?.trim() || null,
      productCode: raw.productCode?.trim() || null,
      productName: raw.productName?.trim() || name,
      variantName: raw.variantName?.trim() || null,
      size: raw.size?.trim() || null,
      color: raw.color?.trim() || null,
      productId: null,
      variantId: null,
    });
  }

  return { items };
}

export function shouldDeductStockForStatus(status) {
  const normalizedStatus = normalizeOrderStatus(status);
  return [
    'pending',
    'ready_to_ship',
    'pushed_to_carrier',
    'shipping',
    'delivered',
    'partial_delivered',
    'returned',
    'failed',
  ].includes(normalizedStatus);
}

export function shouldRestoreStockForStatus(status) {
  const normalizedStatus = normalizeOrderStatus(status);
  return ['cancelled', 'returned', 'failed'].includes(normalizedStatus);
}

export async function deductOrderStock(tx, orderId, notePrefix = 'Tru ton cho don hang') {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.stockDeductedAt) return order;

  const linkedItems = (order.items || []).filter((item) => item.variantId);
  if (linkedItems.length === 0) {
    return tx.order.update({
      where: { id: orderId },
      data: { stockDeductedAt: new Date() },
      include: { items: true },
    });
  }

  for (const item of linkedItems) {
    const variant = await tx.productVariant.findFirst({
      where: { id: item.variantId, shopId: order.shopId || undefined },
      select: { id: true, sku: true, stockQuantity: true, productId: true },
    });
    if (!variant) throw new Error('SKU khong thuoc shop hien tai.');
    if (variant.stockQuantity < item.quantity) {
      throw new Error(`SKU ${variant.sku} chi con ${variant.stockQuantity}, khong du de tru ton cho don ${order.code}.`);
    }

    await tx.productVariant.update({
      where: { id: variant.id },
      data: { stockQuantity: { decrement: item.quantity } },
    });
    await tx.inventoryMovement.create({
      data: {
        shopId: order.shopId,
        productId: item.productId || variant.productId,
        variantId: variant.id,
        orderId: order.id,
        type: 'order',
        quantity: -item.quantity,
        note: `${notePrefix} ${order.code}`,
      },
    });
  }

  return tx.order.update({
    where: { id: orderId },
    data: { stockDeductedAt: new Date(), stockRestoredAt: null },
    include: { items: true },
  });
}

export async function restoreOrderStock(tx, orderId, notePrefix = 'Hoan ton cho don hang') {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || !order.stockDeductedAt || order.stockRestoredAt) return order;

  const linkedItems = (order.items || []).filter((item) => item.variantId);
  for (const item of linkedItems) {
    const variant = await tx.productVariant.findFirst({
      where: { id: item.variantId, shopId: order.shopId || undefined },
      select: { id: true, productId: true },
    });
    if (!variant) continue;

    await tx.productVariant.update({
      where: { id: variant.id },
      data: { stockQuantity: { increment: item.quantity } },
    });
    await tx.inventoryMovement.create({
      data: {
        shopId: order.shopId,
        productId: item.productId || variant.productId,
        variantId: variant.id,
        orderId: order.id,
        type: 'adjustment',
        quantity: item.quantity,
        note: `${notePrefix} ${order.code}`,
      },
    });
  }

  return tx.order.update({
    where: { id: orderId },
    data: { stockRestoredAt: new Date() },
    include: { items: true },
  });
}

export async function applyInventoryRuleForOrderStatus(tx, orderId, status, note = '') {
  const normalizedStatus = normalizeOrderStatus(status);
  if (shouldDeductStockForStatus(normalizedStatus)) {
    await deductOrderStock(tx, orderId, note || 'Tru ton cho don hang');
  }
  if (shouldRestoreStockForStatus(normalizedStatus)) {
    await restoreOrderStock(tx, orderId, note || 'Hoan ton cho don hang');
  }
}

export function buildStatusUpdate(status, currentCodStatus = 'pending') {
  const normalizedStatus = normalizeOrderStatus(status);
  const normalizedCodStatus = getCodStatusForOrderStatus(normalizedStatus, currentCodStatus);
  const data = {
    status: normalizedStatus,
    codStatus: normalizedCodStatus,
  };

  if (normalizedStatus === 'delivered') {
    data.deliveredAt = new Date();
    data.codCollectedAt = new Date();
  }
  if (normalizedStatus === 'returned' || normalizedStatus === 'failed') {
    data.returnedAt = new Date();
    data.codCollectedAt = null;
  }
  if (normalizedStatus === 'cancelled') {
    data.codCollectedAt = null;
  }

  return data;
}

function pushTimelineEvent(events, event) {
  if (!event?.occurredAt) return;
  events.push({
    id: event.id || `${event.type}-${events.length}`,
    type: event.type,
    title: event.title,
    description: event.description || null,
    status: event.status ? normalizeOrderStatus(event.status) : null,
    carrierCode: event.carrierCode || null,
    trackingCode: event.trackingCode || null,
    occurredAt: event.occurredAt,
  });
}

export function buildOrderTimeline(order) {
  if (!order) return [];

  const events = [];
  const normalizedStatus = normalizeOrderStatus(order.status);
  const chatSession = order.chatSession;
  const carrierEvents = [...(order.carrierEvents || [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const mappedCarrierStatuses = new Set(carrierEvents.map((event) => normalizeOrderStatus(event.mappedOrderStatus)));

  pushTimelineEvent(events, {
    type: 'order_created',
    title: 'Order created',
    description: `${order.code} được tạo từ ${getOrderSourceLabel(order.channel, Boolean(chatSession))}.`,
    status: 'draft',
    occurredAt: order.createdAt,
  });

  if (chatSession) {
    pushTimelineEvent(events, {
      type: 'chatbot_draft_created',
      title: 'Draft created từ chatbot',
      description: [
        chatSession.customerName,
        chatSession.productName,
        chatSession.size ? `size ${chatSession.size}` : null,
      ].filter(Boolean).join(' · ') || 'Chatbot đã thu thập thông tin đơn.',
      status: 'draft',
      occurredAt: chatSession.createdAt || order.createdAt,
    });

    if (chatSession.status === 'confirmed' || normalizedStatus !== 'draft') {
      pushTimelineEvent(events, {
        type: 'confirmed',
        title: 'Confirmed',
        description: 'Shop đã xác nhận đơn nháp để xử lý giao hàng.',
        status: 'pending',
        occurredAt: chatSession.updatedAt || order.updatedAt || order.createdAt,
      });
    }
  } else if (normalizedStatus !== 'draft') {
    pushTimelineEvent(events, {
      type: 'confirmed',
      title: 'Confirmed',
      description: 'Đơn đã vào hàng chờ xử lý.',
      status: normalizedStatus === 'pending' ? 'pending' : null,
      occurredAt: order.createdAt,
    });
  }

  if (order.trackingCode && !mappedCarrierStatuses.has('pushed_to_carrier')) {
    pushTimelineEvent(events, {
      type: 'pushed_to_carrier',
      title: 'Pushed to carrier',
      description: `${order.carrierName || order.shipperCode || 'Carrier'} nhận mã vận đơn ${order.trackingCode}.`,
      status: 'pushed_to_carrier',
      carrierCode: order.shipperCode,
      trackingCode: order.trackingCode,
      occurredAt: order.updatedAt || order.createdAt,
    });
  }

  carrierEvents.forEach((event) => {
    const mappedStatus = normalizeOrderStatus(event.mappedOrderStatus);
    pushTimelineEvent(events, {
      id: event.id,
      type: 'carrier_event',
      title: `CarrierEvent: ${getStatusLabel(mappedStatus)}`,
      description: [event.carrierCode, event.eventStatus, event.note].filter(Boolean).join(' · '),
      status: mappedStatus,
      carrierCode: event.carrierCode,
      trackingCode: event.trackingCode,
      occurredAt: event.createdAt,
    });
  });

  if (order.deliveredAt && !mappedCarrierStatuses.has('delivered')) {
    pushTimelineEvent(events, {
      type: 'delivered',
      title: 'Delivered',
      description: 'Đơn đã giao thành công, COD được ghi nhận đã thu.',
      status: 'delivered',
      occurredAt: order.deliveredAt,
    });
  }

  if (order.returnedAt && normalizedStatus === 'returned' && !mappedCarrierStatuses.has('returned')) {
    pushTimelineEvent(events, {
      type: 'returned',
      title: 'Returned',
      description: order.note || 'Đơn hoàn về shop.',
      status: 'returned',
      occurredAt: order.returnedAt,
    });
  }

  if (order.returnedAt && normalizedStatus === 'failed' && !mappedCarrierStatuses.has('failed')) {
    pushTimelineEvent(events, {
      type: 'failed',
      title: 'Failed',
      description: order.note || 'Carrier báo giao thất bại hoặc kiện vấn đề.',
      status: 'failed',
      occurredAt: order.returnedAt,
    });
  }

  if (normalizedStatus === 'cancelled' && !mappedCarrierStatuses.has('cancelled')) {
    pushTimelineEvent(events, {
      type: 'cancelled',
      title: 'Cancelled',
      description: order.note || 'Đơn đã bị hủy, COD không được tính đã thu.',
      status: 'cancelled',
      occurredAt: order.updatedAt || order.createdAt,
    });
  }

  if (
    normalizedStatus === 'partial_delivered'
    && !mappedCarrierStatuses.has('partial_delivered')
  ) {
    pushTimelineEvent(events, {
      type: 'partial_delivered',
      title: 'Partial delivered',
      description: order.note || 'Khách ký nhận một phần, cần đối soát COD.',
      status: 'partial_delivered',
      occurredAt: order.updatedAt || order.createdAt,
    });
  }

  return events.sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
}
