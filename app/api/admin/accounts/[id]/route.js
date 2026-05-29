import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';

// PATCH /api/admin/accounts/[id] — Update sub-admin (SUPER_ADMIN only)
export async function PATCH(request, { params }) {
  try {
    const { response } = await requireSuperAdmin();
    if (response) return response;

    const { id } = await params;
    const body = await request.json();

    // Verify target is a sub-admin
    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, parentAdminId: true },
    });

    if (!target) return jsonError('Tài khoản không tồn tại.', 404);
    if (target.role !== 'admin' || !target.parentAdminId) {
      return jsonError('Chỉ được sửa tài khoản Admin con.', 403);
    }

    const updateData = {};
    if (body.name !== undefined) updateData.name = String(body.name).trim();
    if (body.status !== undefined && ['active', 'inactive'].includes(body.status)) {
      updateData.status = body.status;
    }

    if (Object.keys(updateData).length === 0) {
      return jsonError('Không có dữ liệu để cập nhật.', 400);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        parentAdminId: true,
        status: true,
        updatedAt: true,
      },
    });

    return jsonSuccess(updated, 'Cập nhật Admin con thành công.');
  } catch (error) {
    return serverError('[PATCH /api/admin/accounts/[id]]', error);
  }
}
