import { prisma } from '@/lib/prisma';
import { assertShopAccess, getScopedShopId, isAdmin } from '@/lib/server/auth';
import { jsonError } from '@/lib/server/responses';

export function getChatSessionInclude() {
  return {
    messages: { orderBy: { createdAt: 'asc' } },
    draftOrder: {
      include: {
        items: true,
        customer: true,
      },
    },
    shop: { select: { id: true, code: true, name: true } },
  };
}

export async function getScopedChatWhere(user, requestShopId = null) {
  const scopedShopId = getScopedShopId(user, requestShopId);
  if (!isAdmin(user) && !scopedShopId) {
    return { error: jsonError('Tai khoan shop chua duoc gan shopId.', 403) };
  }
  return { where: scopedShopId ? { shopId: scopedShopId } : {} };
}

export async function getChatSessionForAccess(user, id) {
  const session = await prisma.chatSession.findUnique({
    where: { id },
    include: getChatSessionInclude(),
  });
  if (!session) {
    return { error: jsonError('Khong tim thay hoi thoai.', 404) };
  }
  const accessError = assertShopAccess(user, session.shopId);
  if (accessError) return { error: accessError };
  return { session };
}
