import { prisma } from '@/lib/prisma';
import { getScopedShopId, requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';

const DEFAULT_SETTINGS = {
  botEnabled: true,
  autoReply: false,
  welcomeMessage: 'Xin chào! Shop đang hỗ trợ bạn chốt đơn, bạn cho shop xin SĐT và địa chỉ giao hàng nhé.',
  missingPhoneMessage: 'Bạn cho shop xin số điện thoại để xác nhận đơn nha.',
  missingAddressMessage: 'Bạn gửi giúp shop địa chỉ nhận hàng đầy đủ nhé.',
  orderConfirmMessage: 'Đơn hàng của bạn đã được shop xác nhận. Shop sẽ đóng gói và gửi hàng sớm nhất.',
};

function cleanText(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export async function GET() {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const shopId = getScopedShopId(user, null);
    if (!shopId) return jsonError('Không xác định được shop.', 400);

    const settings = await prisma.botSettings.upsert({
      where: { shopId },
      update: {},
      create: { shopId, ...DEFAULT_SETTINGS },
    });

    return jsonSuccess(settings);
  } catch (error) {
    return serverError('[GET /api/bot-settings]', error);
  }
}

export async function PUT(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const shopId = getScopedShopId(user, null);
    if (!shopId) return jsonError('Không xác định được shop.', 400);

    const body = await request.json();
    const data = {
      botEnabled: Boolean(body.botEnabled),
      autoReply: Boolean(body.autoReply),
      welcomeMessage: cleanText(body.welcomeMessage),
      missingPhoneMessage: cleanText(body.missingPhoneMessage),
      missingAddressMessage: cleanText(body.missingAddressMessage),
      orderConfirmMessage: cleanText(body.orderConfirmMessage),
    };

    const settings = await prisma.botSettings.upsert({
      where: { shopId },
      update: data,
      create: { shopId, ...DEFAULT_SETTINGS, ...data },
    });

    return jsonSuccess(settings, 'Đã lưu cài đặt chatbot.');
  } catch (error) {
    return serverError('[PUT /api/bot-settings]', error);
  }
}
