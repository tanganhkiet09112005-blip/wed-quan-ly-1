import { jsonSuccess } from '@/lib/server/responses';
import { requireShopOrAdmin } from '@/lib/server/auth';

export async function POST() {
  const { response } = await requireShopOrAdmin();
  if (response) return response;

  return jsonSuccess(null, 'GHTK Integration Scaffolding');
}
