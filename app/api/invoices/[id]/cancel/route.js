import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getScopedShopId, isAdmin, requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, serverError } from '@/lib/server/responses';

export async function POST(request, { params }) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { id } = await params;
    const scopedShopId = getScopedShopId(user);
    if (!isAdmin(user) && !scopedShopId) {
      return jsonError('Forbidden', 403);
    }

    const invoice = await prisma.invoice.findUnique({
      where: {
        id,
        ...(scopedShopId ? { shopId: scopedShopId } : {})
      }
    });

    if (!invoice) {
      return jsonError('Invoice not found', 404);
    }

    if (invoice.status === 'cancelled') {
      return jsonError('Hóa đơn đã bị hủy trước đó', 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.invoice.update({
        where: { id },
        data: {
          status: 'cancelled',
          cancelledAt: new Date()
        }
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          shopId: invoice.shopId,
          userId: user.id,
          action: 'cancel_invoice',
          entityType: 'Invoice',
          entityId: invoice.id,
          payload: JSON.stringify({ code: invoice.code })
        }
      });

      return cancelled;
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return serverError('[POST /api/invoices/[id]/cancel]', error);
  }
}
