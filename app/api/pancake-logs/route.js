import { prisma } from '@/lib/prisma';
import { getScopedShopId, isAdmin, requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';

export async function GET(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');
    const scopedShopId = getScopedShopId(user, searchParams.get('shopId'));
    if (!isAdmin(user) && !scopedShopId) {
      return jsonError('Tai khoan shop chua duoc gan shopId.', 403);
    }

    const where = {};
    if (channel) where.channel = channel;
    if (scopedShopId) where.shopId = scopedShopId;

    const logs = await prisma.pancakeLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return jsonSuccess(logs);
  } catch (error) {
    return serverError('[GET /api/pancake-logs]', error);
  }
}
