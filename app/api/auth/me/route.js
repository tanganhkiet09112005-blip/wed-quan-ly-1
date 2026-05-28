import { getCurrentUser } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError('Chua dang nhap.', 401);
    return jsonSuccess(user);
  } catch (error) {
    return serverError('[GET /api/auth/me]', error);
  }
}
