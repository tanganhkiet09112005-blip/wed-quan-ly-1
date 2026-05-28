import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getScopedShopId, isAdmin, requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, serverError } from '@/lib/server/responses';
import { summarizeOrders } from '@/lib/server/dashboard-service';

export async function GET(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const scopedShopId = getScopedShopId(user, searchParams.get('shopId'));

    if (!scopedShopId) {
      if (isAdmin(user)) {
        return jsonError('Admin can xem tong quan he thong tai /api/dashboard hoac truyen shopId.', 400);
      }
      return jsonError('Tai khoan shop chua duoc gan shopId.', 403);
    }

    const shop = await prisma.shop.findUnique({ where: { id: scopedShopId } });
    if (!shop) return jsonError('Khong tim thay shop.', 404);

    const orders = await prisma.order.findMany({
      where: { shopId: scopedShopId },
      include: {
        items: true,
        shipper: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const summary = summarizeOrders(orders);
    const pendingOrders = ['pending', 'ready_to_ship', 'pushed_to_carrier', 'shipping']
      .reduce((sum, status) => sum + (summary.byStatus[status] || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        shop,
        kpis: {
          totalOrders: summary.totalOrders,
          shippingFeeTotal: summary.shippingFeeTotal,
          codTotal: summary.codCollected,
          codPendingTotal: summary.codPending,
          pendingOrders,
        },
        summary,
        orders,
      },
    });
  } catch (error) {
    return serverError('[GET /api/shop/dashboard]', error);
  }
}
