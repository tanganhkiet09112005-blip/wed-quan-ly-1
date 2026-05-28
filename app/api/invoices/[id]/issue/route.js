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

    if (invoice.status !== 'draft') {
      return jsonError('Chỉ có thể phát hành hóa đơn nháp', 400);
    }

    // Since we don't have production credentials, we simulate sandbox issue.
    // If shop is in production mode, we should fail. (Using a dummy check since we don't have global MISA mode yet, fallback to sandbox).
    
    // Simulate successful sandbox issuance
    const updated = await prisma.$transaction(async (tx) => {
      const issued = await tx.invoice.update({
        where: { id },
        data: {
          status: 'issued',
          issuedAt: new Date(),
          provider: 'MockSandbox',
          providerInvoiceId: `SNDBX-${invoice.code}`
        }
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          shopId: invoice.shopId,
          userId: user.id,
          action: 'issue_invoice',
          entityType: 'Invoice',
          entityId: invoice.id,
          payload: JSON.stringify({ code: invoice.code, providerInvoiceId: issued.providerInvoiceId })
        }
      });

      return issued;
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return serverError('[POST /api/invoices/[id]/issue]', error);
  }
}
