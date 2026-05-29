import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/server/session';
import { jsonError } from '@/lib/server/responses';

export const SHOP_ROLES = ['shop', 'customer', 'staff'];

// ─── Role Helpers ──────────────────────────────────────────────────────────────
// Admin hierarchy:
//   parentAdminId === null  → SUPER_ADMIN (Admin tổng - có toàn quyền)
//   parentAdminId !== null  → ADMIN (Admin con - chỉ quản lý shop được gán)
//   role = "customer"/"staff" → SHOP user

export function isSuperAdmin(user) {
  return user?.role === 'admin' && !user?.parentAdminId;
}

export function isSubAdmin(user) {
  return user?.role === 'admin' && Boolean(user?.parentAdminId);
}

export function isAdmin(user) {
  return user?.role === 'admin'; // covers both super and sub
}

export function isShopUser(user) {
  return SHOP_ROLES.includes(user?.role);
}

export function sanitizeUser(user) {
  if (!user) return null;
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

// ─── Session / Auth ────────────────────────────────────────────────────────────

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

export async function requireSuperAdmin() {
  const result = await requireAuth({ roles: ['admin'] });
  if (result.response) return result;

  if (!isSuperAdmin(result.user)) {
    return {
      user: result.user,
      response: jsonError('Chi Super Admin moi co quyen thuc hien thao tac nay.', 403),
    };
  }

  return result;
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

// ─── Shop Access Control ───────────────────────────────────────────────────────

export function getScopedShopId(user, requestedShopId = null) {
  if (isAdmin(user)) return requestedShopId || null;
  return user?.shopId || null;
}

/**
 * Check if a user can access a given shop.
 * - SUPER_ADMIN: can access any shop
 * - ADMIN (sub): can access shops where shop.adminId === user.id OR shop.adminId === null
 *   (to avoid breaking old shops without adminId, super admin handles those)
 * - SHOP user: only their own shopId
 */
export function canAccessShop(user, shopId, shop = null) {
  if (!user || !shopId) return false;

  if (isSuperAdmin(user)) return true;

  if (isSubAdmin(user)) {
    // Sub-admin can only access shops explicitly assigned to them
    if (shop) return shop.adminId === user.id;
    // If shop object not provided, allow tentatively - API must verify with DB
    return true;
  }

  // Shop user - only their own shop
  return Boolean(shopId && user?.shopId === shopId);
}

export function assertShopAccess(user, shopId) {
  if (isSuperAdmin(user)) return null;
  if (!canAccessShop(user, shopId)) {
    return jsonError('Ban khong co quyen truy cap du lieu cua shop nay.', 403);
  }
  return null;
}

/**
 * Check if user can manage (set/edit) pricing for a shop.
 * - SUPER_ADMIN: yes for all shops
 * - ADMIN (sub): yes only for shops they manage (adminId === user.id)
 * - SHOP user: never
 */
export async function canManageShopPricing(user, shopId) {
  if (!user || !isAdmin(user)) return false;
  if (isSuperAdmin(user)) return true;

  // Sub-admin: verify the shop belongs to them
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { adminId: true },
  });
  return shop?.adminId === user.id;
}

/**
 * Verify sub-admin owns this shop (for write operations).
 * Returns error response or null.
 */
export async function assertAdminShopAccess(user, shopId) {
  if (isSuperAdmin(user)) return null;

  if (isSubAdmin(user)) {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { adminId: true },
    });
    if (!shop) return jsonError('Shop khong ton tai.', 404);
    if (shop.adminId !== user.id) {
      return jsonError('Ban khong co quyen quan ly shop nay.', 403);
    }
    return null;
  }

  return jsonError('Ban khong co quyen truy cap.', 403);
}
