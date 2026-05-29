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
      return jsonError('Chỉ Admin mới có quyền đẩy vận chuyển thủ công.', 403);
    }

    let order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        customer: true,
      }
    });

    if (!order) return jsonError('Đơn hàng không tồn tại.', 404);

    if (isSubAdmin(user)) {
      const shop = await prisma.shop.findUnique({ where: { id: order.shopId }, select: { adminId: true } });
      if (!shop || shop.adminId !== user.id) {
        return jsonError('Bạn không có quyền thao tác trên đơn của shop này.', 403);
      }
    }

    if (order.flowStatus !== 'READY_TO_PUSH') {
      return jsonError('Đơn hàng chưa đủ điều kiện để đẩy vận chuyển.', 400);
    }

    if (!order.carrierCode && !order.shipperCode) {
      return jsonError('Đơn hàng chưa chọn đối tác vận chuyển.', 400);
    }
    
    const targetCarrierCode = order.carrierCode || order.shipperCode;

    // Verify credentials again right before pushing
    const targetShipper = await prisma.shopShipper.findFirst({
      where: {
        shopId: order.shopId,
        shipperCode: targetCarrierCode,
        status: 'active',
      }
    });

    if (!targetShipper || !targetShipper.apiToken) {
      // Mark as MISSING_CREDENTIALS
      const updatedOrder = await prisma.$transaction(async (tx) => {
        const updated = await tx.order.update({
          where: { id: orderId },
          data: {
            flowStatus: 'MISSING_CREDENTIALS',
            flowMessage: 'Shop chưa được cấu hình API vận chuyển. Vui lòng liên hệ Admin.',
          }
        });
        await tx.orderFlowLog.create({
          data: {
            orderId,
            fromStatus: 'READY_TO_PUSH',
            toStatus: 'MISSING_CREDENTIALS',
            message: 'Đẩy vận chuyển thất bại do thiếu API credential.',
            actorUserId: user.id
          }
        });
        return updated;
      });
      return jsonSuccess(updatedOrder, 'Đã cập nhật trạng thái do thiếu credential.');
    }

    // Call actual carrier integration
    const { pushOrderToCarrier } = await import('@/lib/carriers/index');
    const carrierResult = await pushOrderToCarrier(targetCarrierCode, {
      ...order,
      shopId: order.shopId,
      items: order.items,
    });

    if (carrierResult?.success && carrierResult.trackingCode) {
      order = await prisma.$transaction(async (tx) => {
        const updated = await tx.order.update({
          where: { id: order.id },
          data: {
            trackingCode: carrierResult.trackingCode,
            shippingFee: carrierResult.fee || order.shippingFee,
            carrierFee: carrierResult.fee || order.carrierFee,
            carrierName: carrierResult.carrierName || null,
            status: 'pushed_to_carrier',
            codStatus: 'collecting',
            flowStatus: 'PUSHED_TO_CARRIER',
            flowMessage: 'Đẩy vận chuyển thành công.',
            pushedAt: new Date()
          }
        });

        await tx.orderFlowLog.create({
          data: {
            orderId: updated.id,
            fromStatus: 'READY_TO_PUSH',
            toStatus: 'PUSHED_TO_CARRIER',
            message: 'Admin đẩy đơn qua vận chuyển thủ công.',
            actorUserId: user.id
          }
        });

        return updated;
      });
    } else {
       order = await prisma.$transaction(async (tx) => {
        const updated = await tx.order.update({
          where: { id: order.id },
          data: {
            flowStatus: 'PUSH_FAILED',
            pushError: carrierResult?.error || 'Lỗi không xác định khi đẩy đơn.'
          }
        });

        await tx.orderFlowLog.create({
          data: {
            orderId: updated.id,
            fromStatus: 'READY_TO_PUSH',
            toStatus: 'PUSH_FAILED',
            message: carrierResult?.error || 'Đẩy đơn thất bại.',
            actorUserId: user.id
          }
        });

        return updated;
      });
    }

    return jsonSuccess(order, carrierResult?.success ? 'Đẩy vận chuyển thành công.' : 'Đẩy vận chuyển thất bại.');
  } catch (error) {
    return serverError('[POST /api/orders/[id]/flow/push-carrier]', error);
  }
}
