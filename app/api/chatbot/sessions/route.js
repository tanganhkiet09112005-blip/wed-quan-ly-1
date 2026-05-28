import { prisma } from '@/lib/prisma';
import { requireShopOrAdmin } from '@/lib/server/auth';
import { jsonSuccess, serverError } from '@/lib/server/responses';
import { getChatSessionInclude, getScopedChatWhere } from '@/lib/server/chatbot-service';

export async function GET(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const scoped = await getScopedChatWhere(user, searchParams.get('shopId'));
    if (scoped.error) return scoped.error;

    const channel = searchParams.get('channel');
    const where = { ...scoped.where };
    if (channel) where.channel = channel;

    const sessions = await prisma.chatSession.findMany({
      where,
      include: getChatSessionInclude(),
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    return jsonSuccess(sessions);
  } catch (error) {
    return serverError('[GET /api/chatbot/sessions]', error);
  }
}
