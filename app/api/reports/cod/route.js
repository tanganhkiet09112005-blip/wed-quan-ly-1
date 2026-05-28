import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getScopedShopId, isAdmin, requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, serverError } from '@/lib/server/responses';
import { normalizeCodStatus, normalizeOrderStatus } from '@/lib/order-constants';

export async function GET(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const scopedShopId = getScopedShopId(user, searchParams.get('shopId'));
    if (!isAdmin(user) && !scopedShopId) {
      return jsonError('Tai khoan shop chua duoc gan shopId.', 403);
    }

    // Optional date filter
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where = {};
    if (scopedShopId) where.shopId = scopedShopId;
    // Include ALL orders with codAmount > 0 (not just those with shipperCode)
    // so draft/pending orders with COD also appear
    where.codAmount = { gt: 0 };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        where.createdAt.gte = from;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }

    const orders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        code: true,
        shippingName: true,
        shippingPhone: true,
        codAmount: true,
        shippingFee: true,
        carrierFee: true,
        carrierName: true,
        status: true,
        codStatus: true,
        shipperCode: true,
        trackingCode: true,
        createdAt: true,
        codCollectedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    // Normalize statuses
    const normalized = orders.map((order) => ({
      ...order,
      status: normalizeOrderStatus(order.status),
      codStatus: normalizeCodStatus(order.codStatus),
      shippingFee: order.carrierFee ?? order.shippingFee ?? 0,
      carrierName: order.carrierName || order.shipperCode || null,
    }));

    // ── COD Summary (based on codStatus — the CORRECT source of truth) ──
    // collected = codStatus collected OR reconciled
    // pending   = codStatus pending
    // collecting = codStatus collecting
    // returned  = codStatus returned
    // cancelled  = codStatus cancelled
    // totalShippingFee = sum of shippingFee across all orders with a carrier

    let codPending = 0;
    let codCollecting = 0;
    let codCollected = 0;
    let codReconciled = 0;
    let codReturned = 0;
    let codCancelled = 0;
    let totalShippingFee = 0;

    const byCarrier = {};

    for (const order of normalized) {
      const cod = Number(order.codAmount || 0);
      const fee = Number(order.shippingFee || 0);
      const carrier = order.shipperCode || 'Khác';

      // COD aggregation by codStatus (correct per spec)
      switch (order.codStatus) {
        case 'pending':    codPending    += cod; break;
        case 'collecting': codCollecting += cod; break;
        case 'collected':  codCollected  += cod; break;
        case 'reconciled': codReconciled += cod; break;
        case 'returned':   codReturned   += cod; break;
        case 'cancelled':  codCancelled  += cod; break;
        default:           codPending    += cod; break;
      }

      // Shipping fee only for orders that have been pushed to a carrier
      if (order.shipperCode) totalShippingFee += fee;

      // Per-carrier breakdown
      if (!byCarrier[carrier]) {
        byCarrier[carrier] = {
          carrier,
          orderCount: 0,
          codPending: 0,
          codCollecting: 0,
          codCollected: 0,  // collected + reconciled combined
          codReturned: 0,   // returned + cancelled combined
          totalShippingFee: 0,
          deliveredCount: 0,
          totalCount: 0,
        };
      }
      const b = byCarrier[carrier];
      b.orderCount += 1;
      b.totalCount += 1;
      if (order.codStatus === 'collected' || order.codStatus === 'reconciled') b.codCollected += cod;
      else if (order.codStatus === 'collecting') b.codCollecting += cod;
      else if (order.codStatus === 'pending') b.codPending += cod;
      else if (order.codStatus === 'returned' || order.codStatus === 'cancelled') b.codReturned += cod;
      if (order.shipperCode) b.totalShippingFee += fee;
      if (order.status === 'delivered') b.deliveredCount += 1;
    }

    // Compute delivery rate per carrier
    const carrierSummary = Object.values(byCarrier).map((c) => ({
      ...c,
      deliveryRate: c.totalCount > 0 ? Math.round((c.deliveredCount / c.totalCount) * 100) : 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          codPending,
          codCollecting,
          codCollected,
          codReconciled,
          codReturned,
          codCancelled,
          // Combined "đã thu" = collected + reconciled
          totalCollected: codCollected + codReconciled,
          // Combined "chờ/đang thu" = pending + collecting
          totalPendingCollecting: codPending + codCollecting,
          // Not collected = returned + cancelled
          totalNotCollected: codReturned + codCancelled,
          totalShippingFee,
          totalOrders: normalized.length,
        },
        byCarrier: carrierSummary,
        orders: normalized,
      },
    });
  } catch (error) {
    return serverError('[GET /api/reports/cod]', error);
  }
}
