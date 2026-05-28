import { prisma } from '@/lib/prisma';
import { requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';
import { encryptSecret, isMaskedSecret, maskSecret, prepareSecretForUpdate } from '@/lib/server/secrets';
import { createAuditLog } from '@/lib/server/audit';

export async function PATCH(request, { params }) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { id } = params;
    const shopId = user.shopId;
    if (!shopId) {
      return jsonError('Tài khoản chưa được liên kết với shop.', 403);
    }

    const connection = await prisma.facebookPageConnection.findUnique({
      where: { id },
    });

    if (!connection || connection.shopId !== shopId) {
      return jsonError('Không tìm thấy kết nối Fanpage này hoặc bạn không có quyền.', 404);
    }

    const body = await request.json();
    const { pageName, accessToken, status } = body;

    const updateData = {};
    if (pageName !== undefined) updateData.pageName = pageName;
    if (status !== undefined) updateData.status = status;
    
    const preparedToken = prepareSecretForUpdate(accessToken);
    if (preparedToken !== undefined) {
      updateData.accessToken = preparedToken;
    }

    const updated = await prisma.facebookPageConnection.update({
      where: { id },
      data: updateData,
    });

    // Ghi Audit Log
    await createAuditLog({
      userId: user.id,
      shopId,
      action: 'update_facebook_connection',
      entityType: 'FacebookPageConnection',
      entityId: id,
      payload: { id, pageName, status },
    });

    return jsonSuccess({
      id: updated.id,
      pageId: updated.pageId,
      pageName: updated.pageName,
      status: updated.status,
      accessTokenMasked: maskSecret(updated.accessToken),
    }, 'Cập nhật kết nối thành công.');
  } catch (error) {
    return serverError('[PATCH /api/facebook/pages/[id]]', error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { id } = params;
    const shopId = user.shopId;
    if (!shopId) {
      return jsonError('Tài khoản chưa được liên kết với shop.', 403);
    }

    const connection = await prisma.facebookPageConnection.findUnique({
      where: { id },
    });

    if (!connection || connection.shopId !== shopId) {
      return jsonError('Không tìm thấy kết nối Fanpage này hoặc bạn không có quyền.', 404);
    }

    await prisma.facebookPageConnection.delete({
      where: { id },
    });

    // Ghi Audit Log
    await createAuditLog({
      userId: user.id,
      shopId,
      action: 'update_facebook_connection',
      entityType: 'FacebookPageConnection',
      entityId: id,
      payload: { action: 'delete', id, pageName: connection.pageName },
    });

    return jsonSuccess(null, 'Đã hủy kết nối Fanpage thành công.');
  } catch (error) {
    return serverError('[DELETE /api/facebook/pages/[id]]', error);
  }
}
