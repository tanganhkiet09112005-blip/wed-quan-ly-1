import { prisma } from '@/lib/prisma';
import { requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';
import {
  buildBotReply,
  buildSessionUpdateFromParsed,
  parseMockComment,
  serializeParsedData,
} from '@/lib/server/chatbot';
import { getChatSessionForAccess, getChatSessionInclude } from '@/lib/server/chatbot-service';

export async function POST(request, { params }) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { id } = await params;
    const { session, error } = await getChatSessionForAccess(user, id);
    if (error) return error;

    const body = await request.json().catch(() => ({}));
    const content = String(body.message || body.content || '').trim();
    if (!content) return jsonError('Noi dung phan hoi la bat buoc.', 400);

    const sender = body.sender === 'shop' ? 'shop' : 'customer';
    const parsed = parseMockComment(content);
    const update = buildSessionUpdateFromParsed(session, parsed);
    const missing = JSON.parse(update.missingFields || '[]');
    const botReply = sender === 'customer' ? buildBotReply(missing) : null;

    const updated = await prisma.chatSession.update({
      where: { id: session.id },
      data: {
        ...update,
        messages: {
          create: [
            { sender, content, parsedData: serializeParsedData(parsed) },
            ...(botReply ? [{ sender: 'bot', content: botReply, parsedData: serializeParsedData({ missing }) }] : []),
          ],
        },
      },
      include: getChatSessionInclude(),
    });

    return jsonSuccess(updated, 'Da luu phan hoi mock.');
  } catch (error) {
    return serverError('[POST /api/chatbot/sessions/[id]/reply]', error);
  }
}
