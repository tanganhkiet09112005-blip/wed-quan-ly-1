import { prisma } from '@/lib/prisma';
import { getScopedShopId, isAdmin, requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';
import {
  buildBotReply,
  buildSessionUpdateFromParsed,
  parseMockComment,
  serializeParsedData,
} from '@/lib/server/chatbot';
import { getChatSessionInclude } from '@/lib/server/chatbot-service';

export async function POST(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const body = await request.json().catch(() => ({}));
    const content = String(body.comment || body.content || body.message || '').trim();
    const channel = body.channel || body.platform || 'fanpage';
    const scopedShopId = getScopedShopId(user, body.shopId);

    if (!content) return jsonError('Noi dung comment la bat buoc.', 400);
    if (!scopedShopId && !isAdmin(user)) {
      return jsonError('Tai khoan shop chua duoc gan shopId.', 403);
    }
    if (!scopedShopId) {
      return jsonError('Admin can truyen shopId de tao mock comment.', 400);
    }

    const parsed = parseMockComment(content);
    const baseSession = {
      customerName: body.customerName || 'Khach livestream',
      customerPhone: parsed.phone,
      shippingAddress: parsed.address,
      productName: parsed.productName,
      size: parsed.size,
      quantity: parsed.quantity,
    };
    const update = buildSessionUpdateFromParsed(baseSession, parsed);
    const missing = JSON.parse(update.missingFields || '[]');
    const botReply = buildBotReply(missing);

    const session = await prisma.chatSession.create({
      data: {
        channel,
        customerName: baseSession.customerName,
        rawComment: content,
        shopId: scopedShopId,
        ...update,
        messages: {
          create: [
            { sender: 'customer', content, parsedData: serializeParsedData(parsed) },
            { sender: 'bot', content: botReply, parsedData: serializeParsedData({ missing }) },
          ],
        },
      },
      include: getChatSessionInclude(),
    });

    return jsonSuccess({ ...session, botReply }, 'Da tao hoi thoai mock tu comment.', 201);
  } catch (error) {
    return serverError('[POST /api/chatbot/mock-comment]', error);
  }
}
