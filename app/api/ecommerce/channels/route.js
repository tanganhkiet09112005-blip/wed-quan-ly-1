import { prisma } from '@/lib/prisma';
import { getScopedShopId, isAdmin, requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';
import { encryptSecret, maskSecret } from '@/lib/server/secrets';

export async function GET(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const requestedShopId = searchParams.get('shopId');
    const scopedShopId = getScopedShopId(user, requestedShopId);

    if (!isAdmin(user) && !scopedShopId) {
      return jsonError('Tài khoản shop chưa được gán shopId.', 403);
    }

    const where = {};
    if (scopedShopId) {
      where.shopId = scopedShopId;
    }

    const connections = await prisma.ecommerceChannelConnection.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        shop: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    // Count order sync history from platform source
    const result = await Promise.all(
      connections.map(async (conn) => {
        const count = await prisma.order.count({
          where: {
            shopId: conn.shopId,
            channel: conn.platform,
          },
        });

        return {
          id: conn.id,
          shopId: conn.shopId,
          shopName: conn.shop?.name || '—',
          shopCode: conn.shop?.code || '—',
          platform: conn.platform,
          mode: conn.mode,
          status: conn.status,
          externalShopId: conn.externalShopId,
          accessToken: conn.accessToken ? maskSecret(conn.accessToken) : '',
          refreshToken: conn.refreshToken ? maskSecret(conn.refreshToken) : '',
          lastSyncAt: conn.lastSyncAt,
          createdAt: conn.createdAt,
          updatedAt: conn.updatedAt,
          syncedOrdersCount: count,
        };
      })
    );

    return jsonSuccess(result, 'Lấy danh sách kết nối sàn thành công.');
  } catch (error) {
    return serverError('[GET /api/ecommerce/channels]', error);
  }
}

export async function POST(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const body = await request.json();
    const shopId = isAdmin(user) ? body.shopId : user.shopId;

    if (!shopId) {
      return jsonError('Tài khoản shop chưa được gán shopId.', 403);
    }

    const { platform, mode, status, externalShopId, accessToken, refreshToken } = body;

    // Validate inputs
    if (!platform || !['shopee', 'lazada', 'tiktok'].includes(platform)) {
      return jsonError('Sàn TMĐT không hợp lệ (chỉ hỗ trợ shopee, lazada, tiktok).', 400);
    }
    if (!externalShopId?.trim()) {
      return jsonError('Mã gian hàng (External Shop ID) là bắt buộc.', 400);
    }
    if (mode && !['mock', 'sandbox', 'production'].includes(mode)) {
      return jsonError('Chế độ hoạt động không hợp lệ.', 400);
    }
    if (status && !['active', 'inactive'].includes(status)) {
      return jsonError('Trạng thái kết nối không hợp lệ.', 400);
    }

    // Check duplicate platform connection for this shop
    const duplicate = await prisma.ecommerceChannelConnection.findFirst({
      where: {
        shopId,
        platform,
        externalShopId: externalShopId.trim(),
      },
    });

    if (duplicate) {
      return jsonError(`Gian hàng "${externalShopId}" trên sàn ${platform.toUpperCase()} đã tồn tại kết nối.`, 400);
    }

    const encryptedAccessToken = accessToken ? encryptSecret(accessToken.trim()) : null;
    const encryptedRefreshToken = refreshToken ? encryptSecret(refreshToken.trim()) : null;

    const newConnection = await prisma.ecommerceChannelConnection.create({
      data: {
        shopId,
        platform,
        mode: mode || 'mock',
        status: status || 'active',
        externalShopId: externalShopId.trim(),
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
      },
    });

    const responsePayload = {
      ...newConnection,
      accessToken: newConnection.accessToken ? maskSecret(newConnection.accessToken) : '',
      refreshToken: newConnection.refreshToken ? maskSecret(newConnection.refreshToken) : '',
      syncedOrdersCount: 0,
    };

    return jsonSuccess(responsePayload, 'Tạo kết nối sàn TMĐT thành công.', 201);
  } catch (error) {
    return serverError('[POST /api/ecommerce/channels]', error);
  }
}
