import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';

export async function POST(request, { params }) {
  try {
    const { user, response } = await requireAdmin();
    if (response) return response;

    const { id } = await params;
    if (!id) return jsonError('Thiếu shop ID.', 400);

    const body = await request.json();
    const { autoIssueInvoiceEnabled, invoiceProvider, invoiceMode } = body;

    const shop = await prisma.shop.findUnique({ where: { id } });
    if (!shop) return jsonError('Không tìm thấy shop.', 404);

    if (user.role === 'admin' && user.parentAdminId && shop.adminId !== user.id) {
      return jsonError('Không có quyền thao tác trên shop này.', 403);
    }

    const updated = await prisma.shop.update({
      where: { id },
      data: {
        autoIssueInvoiceEnabled: Boolean(autoIssueInvoiceEnabled),
        invoiceProvider: invoiceProvider || 'MISA',
        invoiceMode: invoiceMode || 'MOCK',
      },
      select: {
        id: true,
        autoIssueInvoiceEnabled: true,
        invoiceProvider: true,
        invoiceMode: true,
      }
    });

    return jsonSuccess(updated, 'Đã cập nhật cấu hình hóa đơn thành công.');
  } catch (error) {
    return serverError('[POST /api/shops/[id]/invoice-config]', error);
  }
}
