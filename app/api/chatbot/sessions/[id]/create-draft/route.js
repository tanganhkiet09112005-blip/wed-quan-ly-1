import { prisma } from '@/lib/prisma';
import { requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';
import { getMissingFields } from '@/lib/server/chatbot';
import {
  generateOrderCode,
  resolveOrderCustomer,
} from '@/lib/server/order-service';
import { getChatSessionForAccess, getChatSessionInclude } from '@/lib/server/chatbot-service';

export async function POST(request, { params }) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { id } = await params;
    const { session, error } = await getChatSessionForAccess(user, id);
    if (error) return error;

    if (session.draftOrderId) {
      return jsonSuccess(session, 'Hoi thoai da co don nhap.');
    }

    const missing = getMissingFields(session);
    if (missing.length > 0) {
      return jsonError('Hoi thoai chua du thong tin de tao don nhap.', 400, { missing });
    }

    if (!session.shopId) {
      return jsonError('Hoi thoai chua gan voi shop.', 400);
    }

    const body = await request.json().catch(() => ({}));
    const quantity = Number(session.quantity || 0);
    const unitPrice = Number(body.price || body.unitPrice || 0);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return jsonError('So luong trong hoi thoai khong hop le.', 400);
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return jsonError('Don gia khong hop le.', 400);
    }
    const totalValue = unitPrice * quantity;
    const codAmount = body.codAmount !== undefined && body.codAmount !== ''
      ? Number(body.codAmount)
      : totalValue;
    if (!Number.isFinite(codAmount) || codAmount < 0) {
      return jsonError('COD khong hop le.', 400);
    }
    const itemName = `${session.productName}${session.size ? ` - size ${session.size}` : ''}`;

    const updatedSession = await prisma.$transaction(async (tx) => {
      const customerResult = await resolveOrderCustomer(tx, session.shopId, {
        shippingName: session.customerName || 'Khach hang Facebook',
        shippingPhone: session.customerPhone,
        shippingAddress: session.shippingAddress,
      });
      if (customerResult.error) throw new Error(customerResult.error);

      const order = await tx.order.create({
        data: {
          code: generateOrderCode(),
          status: 'draft',
          codStatus: 'pending',
          totalValue,
          codAmount,
          shippingFee: 0,
          carrierFee: 0,
          channel: session.channel,
          note: `Draft tu chatbot mock session ${session.id}`,
          shippingName: session.customerName || 'Khach hang Facebook',
          shippingPhone: session.customerPhone,
          shippingAddress: session.shippingAddress,
          customerId: customerResult.customerId,
          shopId: session.shopId,
          items: {
            create: [{
              name: itemName,
              productName: session.productName || itemName,
              variantName: session.size ? `size ${session.size}` : null,
              size: session.size || null,
              quantity,
              price: unitPrice,
              unitPrice,
              lineTotal: totalValue,
            }],
          },
        },
      });

      return tx.chatSession.update({
        where: { id: session.id },
        data: {
          status: 'draft_created',
          draftOrderId: order.id,
          messages: {
            create: {
              sender: 'bot',
              content: `Da tao don nhap ${order.code}. Shop co the xac nhan don khi san sang.`,
            },
          },
        },
        include: getChatSessionInclude(),
      });
    });

    return jsonSuccess(updatedSession, 'Da tao don nhap tu hoi thoai.');
  } catch (error) {
    if (error?.message === 'Khach hang khong thuoc shop hien tai.') {
      return jsonError(error.message, 403);
    }
    return serverError('[POST /api/chatbot/sessions/[id]/create-draft]', error);
  }
}
