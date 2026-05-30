import { prisma } from '@/lib/prisma';
import { assertShopAccess, requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';
import { normalizePhone } from '@/lib/server/order-service';

export async function PATCH(request, { params }) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { id } = await params;
    if (!id) return jsonError('Thiếu customer ID.', 400);

    const body = await request.json();
    const updateData = {};

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.phone !== undefined) updateData.phone = normalizePhone(body.phone);
    if (body.email !== undefined) updateData.email = body.email.trim();
    if (body.address !== undefined) updateData.address = body.address.trim();
    if (body.status !== undefined) updateData.status = body.status;
    if (body.blacklistReason !== undefined) updateData.blacklistReason = body.blacklistReason;

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return jsonError('Không tìm thấy khách hàng.', 404);

    const accessError = await assertShopAccess(user, customer.shopId);
    if (accessError) return accessError;

    if (updateData.phone && updateData.phone !== customer.phone) {
      const existing = await prisma.customer.findUnique({
        where: { shopId_phone: { shopId: customer.shopId, phone: updateData.phone } },
      });
      if (existing) return jsonError('Số điện thoại này đã tồn tại trong shop.', 409);
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    return jsonSuccess(updated, 'Cập nhật khách hàng thành công.');
  } catch (error) {
    return serverError('[PATCH /api/customers/[id]]', error);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { id } = await params;
    if (!id) return jsonError('Thiếu customer ID.', 400);

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return jsonError('Không tìm thấy khách hàng.', 404);

    const accessError = await assertShopAccess(user, customer.shopId);
    if (accessError) return accessError;

    await prisma.customer.delete({ where: { id } });

    return jsonSuccess({ id }, 'Đã xóa khách hàng.');
  } catch (error) {
    return serverError('[DELETE /api/customers/[id]]', error);
  }
}
