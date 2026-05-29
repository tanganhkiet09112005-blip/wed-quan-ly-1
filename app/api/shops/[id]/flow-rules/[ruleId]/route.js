import { prisma } from '@/lib/prisma';
import { requireShopOrAdmin, isAdmin, isSubAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';

export async function PATCH(request, { params }) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { id: shopId, ruleId } = await params;

    // Permission Check
    if (!isAdmin(user)) {
      return jsonError('Chỉ Admin mới có quyền sửa quy tắc thông luồng.', 403);
    }
    if (isSubAdmin(user)) {
      const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { adminId: true } });
      if (!shop || shop.adminId !== user.id) {
        return jsonError('Bạn không quản lý shop này.', 403);
      }
    }

    const body = await request.json();
    const updateData = {};
    if (body.name !== undefined) updateData.name = String(body.name).trim();
    if (body.priority !== undefined) updateData.priority = Number(body.priority);
    if (body.conditionType !== undefined) updateData.conditionType = body.conditionType;
    if (body.conditionValue !== undefined) updateData.conditionValue = body.conditionValue ? String(body.conditionValue).trim() : null;
    if (body.action !== undefined) updateData.action = body.action;
    if (body.carrierCode !== undefined) updateData.carrierCode = body.carrierCode || null;
    if (body.requireApproval !== undefined) updateData.requireApproval = Boolean(body.requireApproval);
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);

    const updatedRule = await prisma.orderFlowRule.update({
      where: { id: ruleId, shopId },
      data: updateData,
    });

    return jsonSuccess(updatedRule, 'Cập nhật quy tắc thành công.');
  } catch (error) {
    if (error.code === 'P2025') return jsonError('Không tìm thấy quy tắc.', 404);
    return serverError('[PATCH /api/shops/[id]/flow-rules/[ruleId]]', error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { id: shopId, ruleId } = await params;

    // Permission Check
    if (!isAdmin(user)) {
      return jsonError('Chỉ Admin mới có quyền xóa quy tắc thông luồng.', 403);
    }
    if (isSubAdmin(user)) {
      const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { adminId: true } });
      if (!shop || shop.adminId !== user.id) {
        return jsonError('Bạn không quản lý shop này.', 403);
      }
    }

    await prisma.orderFlowRule.delete({
      where: { id: ruleId, shopId },
    });

    return jsonSuccess(null, 'Đã xóa quy tắc.');
  } catch (error) {
    if (error.code === 'P2025') return jsonError('Không tìm thấy quy tắc.', 404);
    return serverError('[DELETE /api/shops/[id]/flow-rules/[ruleId]]', error);
  }
}
