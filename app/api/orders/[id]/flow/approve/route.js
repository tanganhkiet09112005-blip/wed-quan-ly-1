import { prisma } from '@/lib/prisma';
import { requireShopOrAdmin, isAdmin, isSubAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';

export async function POST(request, { params }) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { id: orderId } = await params;

    // Check permissions
    if (!isAdmin(user)) {
      return jsonError('Chỉ Admin mới có quyền duyệt đơn hàng.', 403);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, shopId: true, flowStatus: true, status: true }
    });

    if (!order) return jsonError('Đơn hàng không tồn tại.', 404);

    if (isSubAdmin(user)) {
      const shop = await prisma.shop.findUnique({ where: { id: order.shopId }, select: { adminId: true } });
      if (!shop || shop.adminId !== user.id) {
        return jsonError('Bạn không có quyền duyệt đơn của shop này.', 403);
      }
    }

    if (order.flowStatus !== 'WAITING_APPROVAL') {
      return jsonError('Đơn hàng không ở trạng thái chờ duyệt.', 400);
    }

    // Approve the order flow
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          flowStatus: 'READY_TO_PUSH',
        }
      });

      await tx.orderFlowLog.create({
        data: {
          orderId,
          fromStatus: 'WAITING_APPROVAL',
          toStatus: 'READY_TO_PUSH',
          message: 'Admin đã duyệt luồng đơn hàng.',
          actorUserId: user.id
        }
      });

      return updated;
    });

    return jsonSuccess(updatedOrder, 'Đã duyệt đơn hàng thành công.');
  } catch (error) {
    return serverError('[POST /api/orders/[id]/flow/approve]', error);
  }
}
