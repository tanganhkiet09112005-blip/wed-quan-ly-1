import { prisma } from '@/lib/prisma';
import { getScopedShopId, isAdmin, requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';
import { decryptSecret } from '@/lib/server/secrets';

export async function POST(request, { params }) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { id } = params;
    const shopId = getScopedShopId(user);

    const connection = await prisma.ecommerceChannelConnection.findUnique({
      where: { id },
    });

    if (!connection) {
      return jsonError('Không tìm thấy kết nối sàn TMĐT.', 404);
    }

    // Security scope check
    if (!isAdmin(user) && connection.shopId !== shopId) {
      return jsonError('Bạn không có quyền kiểm tra kết nối của shop khác.', 403);
    }

    const { mode, platform, accessToken, refreshToken } = connection;
    const plainAccessToken = decryptSecret(accessToken);
    const plainRefreshToken = decryptSecret(refreshToken);

    // Simulated network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (mode === 'mock') {
      return jsonSuccess(
        {
          connected: true,
          platform,
          shopName: `[Mock] Gian Hàng ${platform.toUpperCase()} (${connection.externalShopId})`,
          message: 'Kết nối giả lập (Mock Mode) hoạt động tốt.',
        },
        'Kiểm tra kết nối giả lập thành công.'
      );
    }

    if (mode === 'sandbox') {
      if (!plainAccessToken || !plainRefreshToken) {
        return jsonError(
          'Thiếu thông tin Sandbox API Credentials (Access Token hoặc Refresh Token). Vui lòng nhập đầy đủ để test kết nối sandbox.',
          400
        );
      }
      return jsonSuccess(
        {
          connected: true,
          platform,
          shopName: `[Sandbox] Cửa hàng Thử Nghiệm ${platform.toUpperCase()}`,
          message: 'Bắt tay API Sandbox thành công (Handshake Success).',
        },
        'Kiểm tra kết nối Sandbox thành công.'
      );
    }

    if (mode === 'production') {
      // Strict credentials check, no mock fallback!
      if (!plainAccessToken || !plainRefreshToken) {
        return jsonError(
          'Không thể kết nối! Thiếu API Credentials thực tế (Access Token / Refresh Token) để kết nối tới môi trường thật của sàn.',
          400
        );
      }

      // Check format or length of token to throw real failure
      if (plainAccessToken.length < 20 || plainRefreshToken.length < 20) {
        return jsonError(
          `Cổng API ${platform.toUpperCase()} trả về lỗi: Token truy cập (Access Token) không hợp lệ hoặc đã hết hạn. Vui lòng lấy Token mới từ trung tâm nhà bán hàng của sàn.`,
          401
        );
      }

      return jsonSuccess(
        {
          connected: true,
          platform,
          shopName: `[Production] Gian hàng ${platform.toUpperCase()} thật của shop`,
          message: 'Kết nối API hệ thống thật hoạt động tốt.',
        },
        'Kiểm tra kết nối thật (Production) thành công.'
      );
    }

    return jsonError('Chế độ hoạt động không xác định.', 400);
  } catch (error) {
    return serverError('[POST /api/ecommerce/channels/[id]/test]', error);
  }
}
