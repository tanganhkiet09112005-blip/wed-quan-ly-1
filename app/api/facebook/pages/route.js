import { prisma } from '@/lib/prisma';
import { requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';
import { encryptSecret, maskSecret } from '@/lib/server/secrets';
import { createAuditLog } from '@/lib/server/audit';

export async function GET(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const shopId = user.shopId;
    if (!shopId) {
      return jsonError('Tài khoản chưa được liên kết với shop.', 403);
    }

    const connections = await prisma.facebookPageConnection.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
    });

    const masked = connections.map((conn) => ({
      id: conn.id,
      pageId: conn.pageId,
      pageName: conn.pageName,
      status: conn.status,
      accessTokenMasked: maskSecret(conn.accessToken),
      createdAt: conn.createdAt,
    }));

    return jsonSuccess(masked);
  } catch (error) {
    return serverError('[GET /api/facebook/pages]', error);
  }
}

export async function POST(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const shopId = user.shopId;
    if (!shopId) {
      return jsonError('Tài khoản chưa được liên kết với shop.', 403);
    }

    const body = await request.json();
    const { pageId, pageName, accessToken, status } = body;

    if (!pageId || !pageName || !accessToken) {
      return jsonError('Vui lòng cung cấp đầy đủ Page ID, Page Name và Access Token.', 400);
    }

    const encryptedToken = encryptSecret(accessToken.trim());

    const connection = await prisma.facebookPageConnection.upsert({
      where: {
        shopId_pageId: {
          shopId,
          pageId,
        },
      },
      update: {
        pageName,
        accessToken: encryptedToken,
        status: status || 'active',
      },
      create: {
        shopId,
        pageId,
        pageName,
        accessToken: encryptedToken,
        status: status || 'active',
      },
    });

    // Ghi Audit Log
    await createAuditLog({
      userId: user.id,
      shopId,
      action: 'update_facebook_connection',
      entityType: 'FacebookPageConnection',
      entityId: connection.id,
      payload: { pageId, pageName, status },
    });

    return jsonSuccess({
      id: connection.id,
      pageId: connection.pageId,
      pageName: connection.pageName,
      status: connection.status,
      accessTokenMasked: maskSecret(connection.accessToken),
    }, 'Đã liên kết Fanpage thành công.');
  } catch (error) {
    return serverError('[POST /api/facebook/pages]', error);
  }
}
