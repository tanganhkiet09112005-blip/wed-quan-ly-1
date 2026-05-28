import { prisma } from '@/lib/prisma';
import { assertShopAccess, requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';
import { normalizeOrderStatus, normalizeOrderForResponse } from '@/lib/order-constants';
import { applyInventoryRuleForOrderStatus, getOrderInclude } from '@/lib/server/order-service';

export async function POST(request, { params }) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, shopId: true, status: true },
    });
    if (!order) return jsonError('Khong tim thay don hang.', 404);

    const accessError = assertShopAccess(user, order.shopId);
    if (accessError) return accessError;

    if (normalizeOrderStatus(order.status) !== 'draft') {
      return jsonError('Chi co the xac nhan don dang o trang thai draft.', 400);
    }

    const body = await request.json().catch(() => ({}));
    const requestedStatus = normalizeOrderStatus(body.status || 'pending');
    const nextStatus = requestedStatus === 'ready_to_ship' ? 'ready_to_ship' : 'pending';

    const updated = await prisma.$transaction(async (tx) => {
      await tx.chatSession.updateMany({
        where: { draftOrderId: id },
        data: { status: 'confirmed' },
      });

      await tx.order.update({
        where: { id },
        data: {
          status: nextStatus,
          codStatus: 'pending',
        },
      });
      await applyInventoryRuleForOrderStatus(tx, id, nextStatus, 'Tru ton khi xac nhan don nhap');
      return tx.order.findUnique({
        where: { id },
        include: getOrderInclude(user.role === 'admin'),
      });
    });

    return jsonSuccess(normalizeOrderForResponse(updated), 'Da xac nhan don nhap.');
  } catch (error) {
    return serverError('[POST /api/orders/[id]/confirm-draft]', error);
  }
}
