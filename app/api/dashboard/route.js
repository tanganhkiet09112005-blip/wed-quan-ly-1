import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server/auth';
import { serverError } from '@/lib/server/responses';
import { summarizeOrders } from '@/lib/server/dashboard-service';

export async function GET() {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const [shops, orders] = await Promise.all([
      prisma.shop.findMany({
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { orders: true } } },
      }),
      prisma.order.findMany({
        select: {
          id: true,
          code: true,
          shopId: true,
          status: true,
          codStatus: true,
          codAmount: true,
          shippingFee: true,
          carrierFee: true,
          shipperCode: true,
          carrierName: true,
          shippingName: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 2000,
      }),
    ]);

    const summary = summarizeOrders(orders);

    // Compute additional aggregates for admin dashboard
    const deliveredCount = orders.filter((o) => {
      const s = o.status?.toLowerCase();
      return s === 'delivered' || s === 'da_giao';
    }).length;
    const returnedCancelledCount = orders.filter((o) => {
      const s = o.status?.toLowerCase();
      return ['returned', 'cancelled', 'failed', 'hoan', 'huy'].includes(s);
    }).length;
    const deliveryRate = summary.totalOrders > 0
      ? Math.round((deliveredCount / summary.totalOrders) * 100)
      : 0;

    // Recent 10 orders for activity feed
    const recentOrders = orders.slice(0, 10).map((o) => {
      const shop = shops.find((s) => s.id === o.shopId);
      return {
        id: o.id,
        code: o.code,
        shopName: shop?.name || '—',
        shopCode: shop?.code || '—',
        shippingName: o.shippingName,
        status: o.status,
        codAmount: Number(o.codAmount || 0),
        createdAt: o.createdAt,
      };
    });

    // Shop reports
    const shopReports = shops.map((shop) => {
      const shopOrders = orders.filter((order) => order.shopId === shop.id);
      const shopSummary = summarizeOrders(shopOrders);
      const carriers = Object.keys(shopSummary.byCarrier || {}).filter((c) => c !== 'NONE');
      return {
        id: shop.id,
        code: shop.code,
        name: shop.name,
        ownerName: shop.ownerName,
        email: shop.email,
        phone: shop.phone,
        status: shop.status,
        createdAt: shop.createdAt,
        ordersCount: shopSummary.totalOrders,
        shippingFeeTotal: shopSummary.shippingFeeTotal,
        codTotal: shopSummary.codCollected,
        codPendingTotal: shopSummary.codPending,
        byStatus: shopSummary.byStatus,
        byCarrier: shopSummary.byCarrier,
        carriers,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          ...summary,
          totalShops: shops.length,
          activeShops: shops.filter((s) => s.status === 'active').length,
          deliveredCount,
          returnedCancelledCount,
          deliveryRate,
        },
        shopReports,
        recentOrders,
      },
    });
  } catch (error) {
    return serverError('[GET /api/dashboard]', error);
  }
}
