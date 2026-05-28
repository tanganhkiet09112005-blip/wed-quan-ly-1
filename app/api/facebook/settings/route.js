import { prisma } from '@/lib/prisma';
import { requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';

const DEFAULT_SETTINGS = {
  botEnabled: true,
  autoReply: false,
  welcomeMessage: 'Chào bạn! Cảm ơn bạn đã quan tâm sản phẩm của shop. Bạn muốn đặt mua sản phẩm nào ạ?',
  missingPhoneMessage: 'Để shop lên đơn cho mình, bạn vui lòng cung cấp Số điện thoại nhé ạ!',
  missingAddressMessage: 'Bạn cho shop xin địa chỉ nhận hàng chi tiết để tính cước phí giao hàng nhé!',
  orderConfirmMessage: 'Shop đã nhận đủ thông tin đặt hàng của bạn. Bạn vui lòng xác nhận đơn hàng nháp này nhé!',
};

export async function GET(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const shopId = user.shopId;
    if (!shopId) {
      return jsonError('Tài khoản chưa được liên kết với shop.', 403);
    }

    let settings = await prisma.botSettings.findUnique({
      where: { shopId },
    });

    if (!settings) {
      settings = await prisma.botSettings.create({
        data: {
          shopId,
          ...DEFAULT_SETTINGS,
        },
      });
    }

    return jsonSuccess(settings);
  } catch (error) {
    return serverError('[GET /api/facebook/settings]', error);
  }
}

export async function PATCH(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const shopId = user.shopId;
    if (!shopId) {
      return jsonError('Tài khoản chưa được liên kết với shop.', 403);
    }

    const body = await request.json();
    const {
      botEnabled,
      autoReply,
      welcomeMessage,
      missingPhoneMessage,
      missingAddressMessage,
      orderConfirmMessage,
    } = body;

    const settings = await prisma.botSettings.upsert({
      where: { shopId },
      update: {
        botEnabled: botEnabled !== undefined ? Boolean(botEnabled) : undefined,
        autoReply: autoReply !== undefined ? Boolean(autoReply) : undefined,
        welcomeMessage: welcomeMessage !== undefined ? welcomeMessage : undefined,
        missingPhoneMessage: missingPhoneMessage !== undefined ? missingPhoneMessage : undefined,
        missingAddressMessage: missingAddressMessage !== undefined ? missingAddressMessage : undefined,
        orderConfirmMessage: orderConfirmMessage !== undefined ? orderConfirmMessage : undefined,
      },
      create: {
        shopId,
        botEnabled: botEnabled !== undefined ? Boolean(botEnabled) : DEFAULT_SETTINGS.botEnabled,
        autoReply: autoReply !== undefined ? Boolean(autoReply) : DEFAULT_SETTINGS.autoReply,
        welcomeMessage: welcomeMessage || DEFAULT_SETTINGS.welcomeMessage,
        missingPhoneMessage: missingPhoneMessage || DEFAULT_SETTINGS.missingPhoneMessage,
        missingAddressMessage: missingAddressMessage || DEFAULT_SETTINGS.missingAddressMessage,
        orderConfirmMessage: orderConfirmMessage || DEFAULT_SETTINGS.orderConfirmMessage,
      },
    });

    return jsonSuccess(settings, 'Đã lưu cấu hình chatbot thành công.');
  } catch (error) {
    return serverError('[PATCH /api/facebook/settings]', error);
  }
}
