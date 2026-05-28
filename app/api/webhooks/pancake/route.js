import { prisma } from '@/lib/prisma';
import { getScopedShopId, isAdmin, requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';

export async function POST(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const payload = await request.json();
    const scopedShopId = getScopedShopId(user, payload.shopId);
    if (!scopedShopId && !isAdmin(user)) {
      return jsonError('Tai khoan shop chua duoc gan shopId.', 403);
    }

    const log = await prisma.pancakeLog.create({
      data: {
        customerName: payload.customerName || 'Khach vang lai',
        comment: payload.comment || 'Chot don hang',
        product: payload.product || 'San pham demo',
        price: Number(payload.price || 0),
        channel: payload.channel || 'fanpage',
        status: 'pending',
        shopId: scopedShopId || null,
      },
    });

    return jsonSuccess(log, 'Pancake webhook mock received.');
  } catch (error) {
    return serverError('[POST /api/webhooks/pancake]', error);
  }
}
