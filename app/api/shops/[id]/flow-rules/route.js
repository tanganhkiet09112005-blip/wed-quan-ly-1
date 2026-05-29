import { prisma } from '@/lib/prisma';
import { requireShopOrAdmin, isAdmin, isSuperAdmin, isSubAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';

export async function GET(request, { params }) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { id: shopId } = await params;

    // Check permissions
    if (!isAdmin(user) && user.shopId !== shopId) {
      return jsonError('Bạn không có quyền xem thông tin shop này.', 403);
    }
    if (isSubAdmin(user)) {
      const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { adminId: true } });
      if (!shop || shop.adminId !== user.id) {
        return jsonError('Bạn không quản lý shop này.', 403);
      }
    }

    const rules = await prisma.orderFlowRule.findMany({
      where: { shopId },
      orderBy: { priority: 'asc' },
    });

    return jsonSuccess(rules);
  } catch (error) {
    return serverError('[GET /api/shops/[id]/flow-rules]', error);
  }
}

export async function POST(request, { params }) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { id: shopId } = await params;

    // Only SUPER_ADMIN and SubAdmin can create rules. SHOP user cannot.
    if (!isAdmin(user)) {
      return jsonError('Chỉ Admin mới có quyền tạo quy tắc thông luồng.', 403);
    }
    if (isSubAdmin(user)) {
      const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { adminId: true } });
      if (!shop || shop.adminId !== user.id) {
        return jsonError('Bạn không quản lý shop này.', 403);
      }
    }

    const body = await request.json();
    const { name, priority, conditionType, conditionValue, action, carrierCode, requireApproval, isActive } = body;

    if (!name || !conditionType || !action) {
      return jsonError('Vui lòng cung cấp đủ tên, điều kiện và hành động.', 400);
    }

    const newRule = await prisma.orderFlowRule.create({
      data: {
        shopId,
        name: String(name).trim(),
        priority: Number(priority || 0),
        conditionType,
        conditionValue: conditionValue ? String(conditionValue).trim() : null,
        action,
        carrierCode: carrierCode || null,
        requireApproval: Boolean(requireApproval),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        createdByAdminId: user.id
      }
    });

    return jsonSuccess(newRule, 'Tạo quy tắc thành công.');
  } catch (error) {
    return serverError('[POST /api/shops/[id]/flow-rules]', error);
  }
}
