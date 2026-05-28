import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getScopedShopId, isAdmin, requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, serverError } from '@/lib/server/responses';

export async function GET(request, { params }) {
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
      },
      include: {
        items: true,
        order: {
          select: { code: true, shippingName: true, status: true, codStatus: true }
        }
      }
    });

    if (!invoice) {
      return jsonError('Invoice not found', 404);
    }

    return NextResponse.json({ success: true, data: invoice });
  } catch (error) {
    return serverError('[GET /api/invoices/[id]]', error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { id } = await params;
    const scopedShopId = getScopedShopId(user);
    if (!isAdmin(user) && !scopedShopId) {
      return jsonError('Forbidden', 403);
    }

    const body = await request.json();

    const existingInvoice = await prisma.invoice.findUnique({
      where: {
        id,
        ...(scopedShopId ? { shopId: scopedShopId } : {})
      }
    });

    if (!existingInvoice) {
      return jsonError('Invoice not found', 404);
    }

    if (existingInvoice.status !== 'draft') {
      return jsonError('Chỉ có thể sửa hóa đơn nháp', 400);
    }

    // Allow updating customer info and items?
    // Let's just allow updating basic info
    const updateData = {};
    if (body.customerName !== undefined) updateData.customerName = body.customerName;
    if (body.customerPhone !== undefined) updateData.customerPhone = body.customerPhone;
    if (body.customerAddress !== undefined) updateData.customerAddress = body.customerAddress;
    if (body.customerTaxCode !== undefined) updateData.customerTaxCode = body.customerTaxCode;
    if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod;

    const updated = await prisma.invoice.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return serverError('[PATCH /api/invoices/[id]]', error);
  }
}
