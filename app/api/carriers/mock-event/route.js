import { applyCarrierMockEvent } from '@/lib/server/carrier-event-service';
import { requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';

export async function POST(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const body = await request.json().catch(() => ({}));
    const result = await applyCarrierMockEvent(user, body);
    if (result.response) return result.response;
    if (!result.ok) return jsonError(result.message, result.status || 400);

    return jsonSuccess(result.data, 'Da cap nhat trang thai tu carrier mock event.');
  } catch (error) {
    return serverError('[POST /api/carriers/mock-event]', error);
  }
}
