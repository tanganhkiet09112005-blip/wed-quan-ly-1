import { prisma } from '@/lib/prisma';
import { CARRIER_NAMES, getCarrierAdapter } from '@/lib/carriers/index';
import { normalizeOrderForResponse, normalizeOrderStatus } from '@/lib/order-constants';
import { assertShopAccess, isAdmin } from '@/lib/server/auth';
import { applyInventoryRuleForOrderStatus } from '@/lib/server/order-service';

export const CARRIER_EVENT_STATUS_MAP = {
  created: 'pushed_to_carrier',
  accepted: 'pushed_to_carrier',
  ready_to_pick: 'pushed_to_carrier',
  item_received_from_sender: 'pushed_to_carrier',
  picking: 'shipping',
  picked: 'shipping',
  picking_up: 'shipping',
  delivering: 'shipping',
  shipping: 'shipping',
  in_transit: 'shipping',
  out_for_delivery: 'shipping',
  delivered: 'delivered',
  partial_delivered: 'partial_delivered',
  returned: 'returned',
  return: 'returned',
  returning: 'returned',
  return_to_sender_transit: 'returned',
  returned_to_sender: 'returned',
  failed: 'failed',
  delivery_failed: 'failed',
  delivery_fail: 'failed',
  exception: 'failed',
  damage: 'failed',
  damaged: 'failed',
  lost: 'failed',
  cancelled: 'cancelled',
  canceled: 'cancelled',
  1: 'pushed_to_carrier',
  2: 'shipping',
  3: 'shipping',
  4: 'shipping',
  5: 'delivered',
  6: 'returned',
  7: 'returned',
  8: 'returned',
  9: 'failed',
  10: 'cancelled',
  11: 'partial_delivered',
  12: 'shipping',
};

export const MOCK_EVENT_STATUSES = [
  'shipping',
  'delivered',
  'partial_delivered',
  'returned',
  'failed',
  'cancelled',
];

export function normalizeCarrierCode(carrierCode) {
  const value = String(carrierCode || '').trim().toUpperCase().replace(/\s+/g, '_');
  if (value === 'J&T' || value === 'J&T_EXPRESS' || value === 'JT_EXPRESS' || value === 'JNT') return 'JT';
  if (value === 'SHOPEE' || value === 'SHOPEE_XPRESS' || value === 'SPX_EXPRESS') return 'SPX';
  return value;
}

export function inferCarrierCodeFromTracking(trackingCode) {
  const value = String(trackingCode || '').trim().toUpperCase();
  if (value.startsWith('GHN')) return 'GHN';
  if (value.startsWith('GHTK')) return 'GHTK';
  if (value.startsWith('SPX')) return 'SPX';
  if (value.startsWith('JT') || value.startsWith('JNT')) return 'JT';
  return null;
}

export function mapCarrierEventStatus(eventStatus) {
  const key = String(eventStatus || '').trim().toLowerCase();
  const mapped = CARRIER_EVENT_STATUS_MAP[key];
  if (!mapped) return null;
  const normalized = normalizeOrderStatus(mapped);
  return normalized === 'pending' ? null : normalized;
}

function buildMockEventOrderUpdate(order, carrierCode, trackingCode, mappedOrderStatus, note) {
  const now = new Date();
  const data = {
    status: mappedOrderStatus,
    trackingCode,
    carrierName: CARRIER_NAMES[carrierCode] || carrierCode,
    updatedAt: now,
  };

  if (!order.shipperCode) {
    data.shipperCode = carrierCode;
  }

  if (note) {
    data.note = [order.note, `[${carrierCode} mock] ${note}`].filter(Boolean).join(' | ');
  }

  if (mappedOrderStatus === 'delivered') {
    data.codStatus = 'collected';
    data.deliveredAt = now;
    data.codCollectedAt = Number(order.codAmount || 0) > 0 ? now : null;
    return data;
  }

  if (mappedOrderStatus === 'partial_delivered') {
    data.codStatus = 'collecting';
    data.codCollectedAt = null;
    return data;
  }

  if (mappedOrderStatus === 'returned' || mappedOrderStatus === 'failed') {
    data.codStatus = 'returned';
    data.returnedAt = now;
    data.codCollectedAt = null;
    return data;
  }

  if (mappedOrderStatus === 'cancelled') {
    data.codStatus = 'cancelled';
    data.codCollectedAt = null;
    return data;
  }

  if (mappedOrderStatus === 'shipping' || mappedOrderStatus === 'pushed_to_carrier') {
    data.codStatus = 'collecting';
  }

  return data;
}

async function findOrderForMockEvent(payload, user) {
  const orderId = String(payload.orderId || '').trim();
  const trackingCode = String(payload.trackingCode || '').trim();

  if (!orderId && !trackingCode) return null;

  const scopedShop = !isAdmin(user) && user?.shopId ? { shopId: user.shopId } : {};

  return orderId && isAdmin(user)
    ? prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, customer: true, shipper: { select: { code: true, name: true } }, shop: true },
    })
    : prisma.order.findFirst({
      where: orderId ? { id: orderId, ...scopedShop } : { trackingCode, ...scopedShop },
      include: { items: true, customer: true, shipper: { select: { code: true, name: true } }, shop: true },
    });
}

export async function applyCarrierMockEvent(user, payload = {}) {
  const order = await findOrderForMockEvent(payload, user);
  if (!order) {
    return { ok: false, status: 404, message: 'Khong tim thay don hang theo orderId/trackingCode.' };
  }

  const accessError = assertShopAccess(user, order.shopId);
  if (accessError) return { ok: false, response: accessError };

  if (!order.shopId) {
    return { ok: false, status: 400, message: 'Don hang chua gan voi shop, khong the mock carrier event.' };
  }

  const carrierCode = normalizeCarrierCode(
    payload.carrierCode || order.shipperCode || inferCarrierCodeFromTracking(payload.trackingCode || order.trackingCode)
  );
  if (!carrierCode || !getCarrierAdapter(carrierCode)) {
    return { ok: false, status: 400, message: 'Carrier khong hop le. Ho tro GHN, GHTK, JT, SPX.' };
  }
  if (order.shipperCode && normalizeCarrierCode(order.shipperCode) !== carrierCode) {
    return { ok: false, status: 400, message: 'carrierCode khong khop voi don hang.' };
  }

  const mappedOrderStatus = mapCarrierEventStatus(payload.eventStatus || payload.status);
  if (!mappedOrderStatus) {
    return { ok: false, status: 400, message: 'Trang thai carrier event khong hop le.' };
  }

  const trackingCode = String(payload.trackingCode || order.trackingCode || '').trim();
  if (!trackingCode) {
    return { ok: false, status: 400, message: 'Don hang chua co trackingCode. Hay day don qua carrier mock truoc.' };
  }

  if (payload.orderId && order.trackingCode && String(payload.trackingCode || order.trackingCode).trim() !== order.trackingCode) {
    return { ok: false, status: 400, message: 'trackingCode khong khop voi don hang.' };
  }

  const eventStatus = String(payload.eventStatus || payload.status || '').trim();
  const note = String(payload.note || '').trim();

  const result = await prisma.$transaction(async (tx) => {
    const shipperExists = await tx.shipperPartner.findUnique({
      where: { code: carrierCode },
      select: { code: true },
    });
    const updateData = buildMockEventOrderUpdate(order, carrierCode, trackingCode, mappedOrderStatus, note);
    if (!shipperExists) delete updateData.shipperCode;

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: updateData,
      include: { items: true, customer: true, shipper: { select: { code: true, name: true } }, shop: true },
    });

    await applyInventoryRuleForOrderStatus(tx, order.id, mappedOrderStatus, 'Cap nhat ton theo carrier mock');

    const event = await tx.carrierEvent.create({
      data: {
        shopId: order.shopId,
        orderId: order.id,
        carrierCode,
        trackingCode,
        eventStatus,
        mappedOrderStatus,
        rawPayload: JSON.stringify({
          carrierCode,
          trackingCode,
          eventStatus,
          note: note || null,
          mock: true,
        }),
        note: note || null,
      },
    });

    return { updatedOrder, event };
  });

  return {
    ok: true,
    data: {
      order: normalizeOrderForResponse(result.updatedOrder),
      event: result.event,
    },
  };
}
