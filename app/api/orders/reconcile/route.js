import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShopOrAdmin, isAdmin, getScopedShopId } from '@/lib/server/auth';
import { jsonError, serverError } from '@/lib/server/responses';

export async function POST(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    // Only Admin can reconcile
    if (!isAdmin(user)) {
      return jsonError('Ban khong co quyen thuc hien thao tac nay.', 403);
    }

    const body = await request.json();
    const { orderIds } = body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return jsonError('Vui long chon it nhat mot don hang.', 400);
    }

    const scopedShopId = getScopedShopId(user, null);

    const where = {
      id: { in: orderIds }
    };
    if (scopedShopId) {
      where.shopId = scopedShopId;
    }

    const result = await prisma.order.updateMany({
      where,
      data: {
        reconciliationStatus: 'RECONCILED',
        reconciledAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: `Đã đối soát ${result.count} đơn hàng.`,
      count: result.count
    });

  } catch (error) {
    return serverError('[POST /api/orders/reconcile]', error);
  }
}
