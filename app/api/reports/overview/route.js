import { prisma } from '@/lib/prisma';
import { requireShopOrAdmin, getScopedShopId } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';

export async function GET(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;
    const shopId = getScopedShopId(user, null);
    if (!shopId) return jsonError('Không xác định được shop.', 400);

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where = { shopId };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59Z');
    }

    const orders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        status: true,
        codStatus: true,
        codAmount: true,
        shippingFee: true,
        carrierFee: true,
        shipperCode: true,
        channel: true,
        createdAt: true,
      },
    });

    // Aggregates
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter((o) => {
      const s = o.status?.toLowerCase();
      return s === 'delivered';
    }).length;
    const returnedOrders = orders.filter((o) => {
      const s = o.status?.toLowerCase();
      return s === 'returned' || s === 'cancelled' || s === 'failed';
    }).length;
    const deliveryRate = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

    const codCollected = orders
      .filter((o) => {
        const cs = o.codStatus?.toLowerCase();
        return cs === 'collected' || cs === 'reconciled';
      })
      .reduce((s, o) => s + Number(o.codAmount || 0), 0);

    const shippingFeeTotal = orders
      .filter((o) => !['cancelled', 'failed'].includes(o.status?.toLowerCase()))
      .reduce((s, o) => s + Number(o.shippingFee || 0), 0);

    // By status
    const byStatus = {};
    const byChannel = {};
    const byCarrier = {};

    for (const order of orders) {
      const s = order.status || 'unknown';
      byStatus[s] = (byStatus[s] || 0) + 1;

      const ch = order.channel || 'direct';
      byChannel[ch] = (byChannel[ch] || 0) + 1;

      if (order.shipperCode) {
        byCarrier[order.shipperCode] = (byCarrier[order.shipperCode] || 0) + 1;
      }
    }

    return jsonSuccess({
      kpis: { totalOrders, deliveredOrders, returnedOrders, deliveryRate, codCollected, shippingFeeTotal },
      byStatus,
      byChannel,
      byCarrier,
    });
  } catch (error) {
    return serverError('[GET /api/reports/overview]', error);
  }
}
