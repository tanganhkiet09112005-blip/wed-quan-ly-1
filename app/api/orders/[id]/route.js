import { prisma } from '@/lib/prisma';
import { assertShopAccess, requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';
import { applyInventoryRuleForOrderStatus, buildOrderTimeline, buildStatusUpdate } from '@/lib/server/order-service';
import {
  COD_STATUSES,
  ORDER_STATUSES,
  normalizeCodStatus,
  normalizeOrderForResponse,
  normalizeOrderStatus,
} from '@/lib/order-constants';

const ALLOWED_PATCH_FIELDS = new Set([
  'status',
  'trackingCode',
  'shippingFee',
  'carrierFee',
  'carrierName',
  'codAmount',
  'codStatus',
  'note',
  'deliveredAt',
  'returnedAt',
]);

async function getOrderForAccess(id) {
  return prisma.order.findUnique({
    where: { id },
    select: { id: true, shopId: true, status: true, codStatus: true },
  });
}

function getDetailInclude() {
  return {
    items: {
      include: {
        product: { select: { id: true, code: true, name: true } },
        variant: { select: { id: true, sku: true, name: true, size: true, color: true, price: true, stockQuantity: true } },
      },
    },
    customer: true,
    shipper: true,
    invoice: true,
    shop: true,
    chatSession: {
      select: {
        id: true,
        channel: true,
        customerName: true,
        customerPhone: true,
        shippingAddress: true,
        productName: true,
        size: true,
        quantity: true,
        status: true,
        missingFields: true,
        rawComment: true,
        createdAt: true,
        updatedAt: true,
      },
    },
    carrierEvents: {
      orderBy: { createdAt: 'asc' },
    },
  };
}

export async function GET(_request, { params }) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { id } = await params;
    const accessOrder = await getOrderForAccess(id);
    if (!accessOrder) return jsonError('Khong tim thay don hang.', 404);

    const accessError = await assertShopAccess(user, accessOrder.shopId);
    if (accessError) return accessError;

    const order = await prisma.order.findUnique({
      where: { id },
      include: getDetailInclude(),
    });

    return jsonSuccess({
      ...normalizeOrderForResponse(order),
      timeline: buildOrderTimeline(order),
    });
  } catch (error) {
    return serverError('[GET /api/orders/[id]]', error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { id } = await params;
    const accessOrder = await getOrderForAccess(id);
    if (!accessOrder) return jsonError('Khong tim thay don hang.', 404);

    const accessError = await assertShopAccess(user, accessOrder.shopId);
    if (accessError) return accessError;

    const body = await request.json();
    const data = {};

    for (const [key, value] of Object.entries(body)) {
      if (ALLOWED_PATCH_FIELDS.has(key)) data[key] = value;
    }

    if (Object.keys(data).length === 0) {
      return jsonError('Khong co truong hop le de cap nhat.', 400);
    }

    if (data.shippingFee !== undefined) data.shippingFee = Number(data.shippingFee);
    if (data.carrierFee !== undefined) data.carrierFee = Number(data.carrierFee);
    if (data.codAmount !== undefined) data.codAmount = Number(data.codAmount);
    if (data.codStatus !== undefined) {
      data.codStatus = normalizeCodStatus(data.codStatus);
      if (!COD_STATUSES.includes(data.codStatus)) return jsonError('Trang thai COD khong hop le.', 400);
    }
    if (data.status !== undefined) {
      data.status = normalizeOrderStatus(data.status);
      if (!ORDER_STATUSES.includes(data.status)) return jsonError('Trang thai don hang khong hop le.', 400);
      if (data.status === 'cancelled' && normalizeOrderStatus(accessOrder.status) === 'delivered') {
        return jsonError('Khong the huy don da giao.', 400);
      }
      Object.assign(data, buildStatusUpdate(data.status, accessOrder.codStatus || data.codStatus));
    }
    data.updatedAt = new Date();

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data,
        include: getDetailInclude(),
      });
      if (data.status !== undefined) {
        await applyInventoryRuleForOrderStatus(tx, id, data.status, data.status === 'cancelled' ? 'Hoan ton khi huy don' : 'Cap nhat ton theo trang thai don');
      }
      return tx.order.findUnique({
        where: { id },
        include: getDetailInclude(),
      });
    });

    return jsonSuccess({
      ...normalizeOrderForResponse(order),
      timeline: buildOrderTimeline(order),
    }, 'Cap nhat don hang thanh cong.');
  } catch (error) {
    return serverError('[PATCH /api/orders/[id]]', error);
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { id } = await params;
    const accessOrder = await getOrderForAccess(id);
    if (!accessOrder) return jsonError('Khong tim thay don hang.', 404);

    const accessError = await assertShopAccess(user, accessOrder.shopId);
    if (accessError) return accessError;

    if (normalizeOrderStatus(accessOrder.status) === 'delivered') {
      return jsonError('Khong the huy don da giao.', 400);
    }

    const order = await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: { status: 'cancelled', codStatus: 'cancelled', codCollectedAt: null, updatedAt: new Date() },
      });
      await applyInventoryRuleForOrderStatus(tx, id, 'cancelled', 'Hoan ton khi huy don');
      return tx.order.findUnique({
        where: { id },
        include: getDetailInclude(),
      });
    });

    return jsonSuccess({
      ...normalizeOrderForResponse(order),
      timeline: buildOrderTimeline(order),
    }, 'Da huy don hang.');
  } catch (error) {
    return serverError('[DELETE /api/orders/[id]]', error);
  }
}
