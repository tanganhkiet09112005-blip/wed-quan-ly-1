import { prisma } from '@/lib/prisma';
import { getScopedShopId, isAdmin, requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';
import { maskSecret, prepareSecretForUpdate } from '@/lib/server/secrets';

export async function PATCH(request, { params }) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { id } = params;
    const body = await request.json();
    const shopId = getScopedShopId(user);

    const connection = await prisma.ecommerceChannelConnection.findUnique({
      where: { id },
    });

    if (!connection) {
      return jsonError('Không tìm thấy kết nối sàn TMĐT.', 404);
    }

    // Tenant authorization check
    if (!isAdmin(user) && connection.shopId !== shopId) {
      return jsonError('Bạn không có quyền sửa kết nối của shop khác.', 403);
    }

    const { mode, status, externalShopId, accessToken, refreshToken } = body;

    // Validate inputs if provided
    if (mode && !['mock', 'sandbox', 'production'].includes(mode)) {
      return jsonError('Chế độ hoạt động không hợp lệ.', 400);
    }
    if (status && !['active', 'inactive'].includes(status)) {
      return jsonError('Trạng thái kết nối không hợp lệ.', 400);
    }

    const updateData = {};
    if (mode !== undefined) updateData.mode = mode;
    if (status !== undefined) updateData.status = status;
    if (externalShopId !== undefined) updateData.externalShopId = externalShopId.trim();

    // Secure prepare secrets
    const nextAccessToken = prepareSecretForUpdate(accessToken);
    const nextRefreshToken = prepareSecretForUpdate(refreshToken);

    if (nextAccessToken !== undefined) updateData.accessToken = nextAccessToken;
    if (nextRefreshToken !== undefined) updateData.refreshToken = nextRefreshToken;

    const updated = await prisma.ecommerceChannelConnection.update({
      where: { id },
      data: updateData,
    });

    const responsePayload = {
      ...updated,
      accessToken: updated.accessToken ? maskSecret(updated.accessToken) : '',
      refreshToken: updated.refreshToken ? maskSecret(updated.refreshToken) : '',
    };

    return jsonSuccess(responsePayload, 'Cập nhật kết nối sàn thành công.');
  } catch (error) {
    return serverError('[PATCH /api/ecommerce/channels/[id]]', error);
  }
}
