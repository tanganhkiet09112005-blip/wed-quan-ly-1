import { prisma } from '@/lib/prisma';
import { requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';
import { issueInvoiceForOrder } from '@/lib/server/invoice-service';

export async function POST(request, { params }) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { id } = await params;
    if (!id) return jsonError('Thiếu order ID.', 400);

    const order = await prisma.order.findUnique({
      where: { id },
      include: { shop: true }
    });

    if (!order) return jsonError('Không tìm thấy đơn hàng.', 404);

    // Permission check
    if (user.role === 'admin' && user.parentAdminId && order.shop?.adminId !== user.id) {
      return jsonError('Không có quyền thao tác trên đơn hàng này.', 403);
    }
    if (user.role === 'customer' && order.shopId !== user.shopId) {
      return jsonError('Không có quyền thao tác trên đơn hàng này.', 403);
    }

    if (order.status !== 'delivered') {
      return jsonError('Chỉ có thể xuất hóa đơn cho đơn đã giao thành công.', 400);
    }

    const result = await issueInvoiceForOrder(id, { trigger: 'MANUAL' });
    
    if (result.success) {
      return jsonSuccess(null, result.message);
    } else {
      return jsonError(result.error, 400);
    }
  } catch (error) {
    return serverError('[POST /api/orders/[id]/invoice]', error);
  }
}
