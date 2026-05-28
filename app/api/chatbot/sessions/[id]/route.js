import { requireShopOrAdmin } from '@/lib/server/auth';
import { jsonSuccess, serverError } from '@/lib/server/responses';
import { getChatSessionForAccess } from '@/lib/server/chatbot-service';

export async function GET(_request, { params }) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { id } = await params;
    const { session, error } = await getChatSessionForAccess(user, id);
    if (error) return error;

    return jsonSuccess(session);
  } catch (error) {
    return serverError('[GET /api/chatbot/sessions/[id]]', error);
  }
}
