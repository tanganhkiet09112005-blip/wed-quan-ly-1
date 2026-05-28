import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { JT_STATUS_MAP } from '@/lib/carriers/jt';
import { verifyOptionalWebhookSecret } from '@/lib/server/webhook';

/**
 * POST /api/webhooks/jt
 * J&T gọi về đây khi trạng thái đơn thay đổi.
 * Cấu hình trong J&T Open API Portal → Webhook Settings
 */
export async function POST(request) {
  try {
    const webhookError = verifyOptionalWebhookSecret(request);
    if (webhookError) return webhookError;

    const body = await request.json();

    // J&T webhook payload
    const { billcode, status, remark, freightfee } = body;

    if (!billcode) {
      return NextResponse.json({ success: false, error: 'Thiếu billcode' }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: { trackingCode: billcode },
    });

    if (!order) {
      console.warn(`[J&T Webhook] Order not found: ${billcode}`);
      return NextResponse.json({ success: true, note: 'Order not found, ignored' });
    }

    const hshipStatus = JT_STATUS_MAP[status] || null;
    const updateData  = {};

    if (hshipStatus)  updateData.status      = hshipStatus;
    if (freightfee)   updateData.shippingFee = freightfee;
    if (hshipStatus === 'delivered') updateData.deliveredAt = new Date();
    if (hshipStatus === 'returned')  updateData.returnedAt  = new Date();
    if (remark)       updateData.note = [order.note, `[J&T] ${remark}`].filter(Boolean).join(' | ');

    await prisma.order.update({ where: { id: order.id }, data: updateData });

    console.log(`[J&T Webhook] ${billcode} → ${status} → Hship: ${hshipStatus}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[J&T Webhook Error]', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
