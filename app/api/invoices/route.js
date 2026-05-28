import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getScopedShopId, isAdmin, requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, serverError } from '@/lib/server/responses';

export async function GET(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const scopedShopId = getScopedShopId(user, searchParams.get('shopId'));
    if (!isAdmin(user) && !scopedShopId) {
      return jsonError('Tai khoan shop chua duoc gan shopId.', 403);
    }

    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const where = {};
    if (scopedShopId) where.shopId = scopedShopId;
    if (status) where.status = status;
    if (type) where.type = type;

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
        { order: { code: { contains: search } } }
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: { 
        order: { select: { id: true, code: true } }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: invoices });
  } catch (error) {
    return serverError('[GET /api/invoices]', error);
  }
}

export async function POST(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const body = await request.json();
    const { orderId } = body;

    const scopedShopId = getScopedShopId(user, body.shopId);
    if (!isAdmin(user) && !scopedShopId) {
      return jsonError('Forbidden', 403);
    }

    if (!orderId) {
      return jsonError('orderId is required', 400);
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        shopId: scopedShopId || undefined
      },
      include: { items: true }
    });

    if (!order) {
      return jsonError('Order not found', 404);
    }

    const existingInvoice = await prisma.invoice.findFirst({
      where: { orderId: order.id, type: 'sale' }
    });

    if (existingInvoice) {
      return jsonError('Đơn hàng này đã có hóa đơn bán hàng', 400);
    }

    let subtotal = 0;
    const invoiceItemsData = order.items.map(item => {
      subtotal += item.lineTotal;
      return {
        shopId: order.shopId,
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku,
        name: item.name || item.productName || 'Sản phẩm',
        quantity: item.quantity,
        unitPrice: item.unitPrice || item.price,
        taxRate: 10, // Default 10% tax for example, or 0 depending on shop config
        lineTotal: item.lineTotal
      };
    });

    // Recalculate tax based on subtotal or keep simple
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    const result = await prisma.$transaction(async (tx) => {
      const invoiceCount = await tx.invoice.count({
        where: { shopId: order.shopId }
      });
      const nextCode = `INV${new Date().getFullYear()}${String(invoiceCount + 1).padStart(5, '0')}`;

      const invoice = await tx.invoice.create({
        data: {
          shopId: order.shopId,
          orderId: order.id,
          code: nextCode,
          type: 'sale',
          status: 'draft',
          customerName: order.shippingName || 'Khách hàng lẻ',
          customerPhone: order.shippingPhone,
          customerAddress: order.shippingAddress,
          subtotal,
          tax,
          total,
          items: {
            create: invoiceItemsData
          }
        },
        include: { items: true, order: true }
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          shopId: order.shopId,
          userId: user.id,
          action: 'create_invoice',
          entityType: 'Invoice',
          entityId: invoice.id,
          payload: JSON.stringify({ orderId: order.id, code: invoice.code })
        }
      });

      return invoice;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return serverError('[POST /api/invoices]', error);
  }
}
