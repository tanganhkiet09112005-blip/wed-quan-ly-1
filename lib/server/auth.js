import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/server/session';
import { jsonError } from '@/lib/server/responses';

export const SHOP_ROLES = ['shop', 'customer', 'staff'];

export function isAdmin(user) {
  return user?.role === 'admin';
}

export function isShopUser(user) {
  return SHOP_ROLES.includes(user?.role);
}

export function sanitizeUser(user) {
  if (!user) return null;
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: {
      shop: {
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
          ownerName: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!user) return null;
  if (user.shop && user.shop.status !== 'active') return null;

  return sanitizeUser(user);
}

export async function requireAuth(options = {}) {
  const { roles = [] } = options;
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: jsonError('Ban can dang nhap de tiep tuc.', 401),
    };
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return {
      user,
      response: jsonError('Ban khong co quyen thuc hien thao tac nay.', 403),
    };
  }

  return { user, response: null };
}

export async function requireAdmin() {
  return requireAuth({ roles: ['admin'] });
}

export async function requireShopOrAdmin() {
  const result = await requireAuth();
  if (result.response) return result;

  if (!isAdmin(result.user) && !isShopUser(result.user)) {
    return {
      user: result.user,
      response: jsonError('Tai khoan khong co quyen truy cap du lieu shop.', 403),
    };
  }

  return result;
}

export function getScopedShopId(user, requestedShopId = null) {
  if (isAdmin(user)) return requestedShopId || null;
  return user?.shopId || null;
}

export function canAccessShop(user, shopId) {
  if (isAdmin(user)) return true;
  return Boolean(shopId && user?.shopId === shopId);
}

export function assertShopAccess(user, shopId) {
  if (!canAccessShop(user, shopId)) {
    return jsonError('Ban khong co quyen truy cap du lieu cua shop nay.', 403);
  }
  return null;
}
