import { prisma } from '@/lib/prisma';
import { pushOrderToCarrier } from '@/lib/carriers/index';
import { normalizeCarrierCode } from '@/lib/server/carrier-event-service';
import { assertShopAccess, requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';
import { normalizeOrderForResponse, normalizeOrderStatus } from '@/lib/order-constants';
import { applyInventoryRuleForOrderStatus } from '@/lib/server/order-service';

export async function POST(request, { params }) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        customer: true,
        shipper: { select: { code: true, name: true } },
      },
    });
    if (!order) return jsonError('Khong tim thay don hang.', 404);

    const accessError = assertShopAccess(user, order.shopId);
    if (accessError) return accessError;

    const status = normalizeOrderStatus(order.status);
    if (status === 'draft') {
      return jsonError('Can xac nhan don nhap truoc khi day qua carrier.', 400);
    }
    if (['delivered', 'returned', 'failed', 'cancelled'].includes(status)) {
      return jsonError('Khong the day carrier cho don da ket thuc.', 400);
    }

    const body = await request.json().catch(() => ({}));
    const carrierCode = normalizeCarrierCode(body.carrierCode || order.shipperCode);
    if (!carrierCode) return jsonError('Thieu carrierCode de day don.', 400);
    if (order.shipperCode && normalizeCarrierCode(order.shipperCode) !== carrierCode) {
      return jsonError('carrierCode khong khop voi don hang.', 400);
    }

    const carrierResult = await pushOrderToCarrier(carrierCode, {
      ...order,
      shipperCode: carrierCode,
      shopId: order.shopId,
    });
    if (!carrierResult?.success) {
      return jsonError(carrierResult?.error || 'Khong day duoc don qua carrier mock.', 400);
    }

    const shipperExists = await prisma.shipperPartner.findUnique({
      where: { code: carrierCode },
      select: { code: true },
    });

    const updateData = {
      trackingCode: carrierResult.trackingCode,
      shippingFee: carrierResult.fee || order.shippingFee || 0,
      carrierFee: carrierResult.fee || order.carrierFee || order.shippingFee || 0,
      carrierName: carrierResult.carrierName || carrierCode,
      status: carrierResult.status || 'pushed_to_carrier',
      codStatus: 'collecting',
    };
    if (shipperExists) updateData.shipperCode = carrierCode;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: updateData,
      });
      await applyInventoryRuleForOrderStatus(tx, order.id, updateData.status, 'Tru ton khi day carrier');
      return tx.order.findUnique({
        where: { id: order.id },
        include: {
          items: true,
          customer: true,
          shipper: { select: { code: true, name: true } },
        },
      });
    });

    return jsonSuccess({
      order: normalizeOrderForResponse(updated),
      carrier: carrierResult,
    }, 'Da day don qua carrier mock.');
  } catch (error) {
    return serverError('[POST /api/orders/[id]/push-carrier]', error);
  }
}
