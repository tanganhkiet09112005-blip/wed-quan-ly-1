import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GHTK_STATUS_MAP } from '@/lib/carriers/ghtk';
import { verifyOptionalWebhookSecret } from '@/lib/server/webhook';
import { issueInvoiceForOrder } from '@/lib/server/invoice-service';
import { applyInventoryRuleForOrderStatus } from '@/lib/server/order-service';

/**
 * POST /api/webhooks/ghtk
 * GHTK gọi về đây khi trạng thái đơn thay đổi.
 * Cấu hình trong GHTK Portal → Cài đặt → Webhook
 */
export async function POST(request) {
  try {
    const webhookError = verifyOptionalWebhookSecret(request);
    if (webhookError) return webhookError;

    const body = await request.json();

    // GHTK webhook payload
    const { partner_id, label, status_id, fee, reason } = body;

    // Tìm đơn theo trackingCode (label) hoặc mã đơn (partner_id)
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { trackingCode: label },
          { code: partner_id },
        ],
      },
    });

    if (!order) {
      console.warn(`[GHTK Webhook] Order not found: label=${label}, partner_id=${partner_id}`);
      return NextResponse.json({ success: true, note: 'Order not found, ignored' });
    }

    const hshipStatus = GHTK_STATUS_MAP[String(status_id)] || null;
    const updateData  = {};

    if (hshipStatus)        updateData.status      = hshipStatus;
    if (fee)                updateData.shippingFee = fee;
    if (hshipStatus === 'delivered') updateData.deliveredAt = new Date();
    if (hshipStatus === 'returned')  updateData.returnedAt  = new Date();
    if (reason)             updateData.note        = [order.note, `[GHTK] ${reason}`].filter(Boolean).join(' | ');

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.order.update({ where: { id: order.id }, data: updateData });
      if (hshipStatus === 'delivered' || hshipStatus === 'cancelled') {
        await applyInventoryRuleForOrderStatus(tx, u.id, hshipStatus, 'GHTK Webhook');
      }
      return u;
    });

    if (hshipStatus === 'delivered' && order.status !== 'delivered') {
      issueInvoiceForOrder(updated.id, { trigger: 'ORDER_DELIVERED' }).catch(e => console.error(e));
    }

    console.log(`[GHTK Webhook] ${label} → status_id=${status_id} → Hship: ${hshipStatus}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[GHTK Webhook Error]', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
