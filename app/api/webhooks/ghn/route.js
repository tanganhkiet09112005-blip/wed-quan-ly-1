import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GHN_STATUS_MAP } from '@/lib/carriers/ghn';
import { verifyOptionalWebhookSecret } from '@/lib/server/webhook';

/**
 * POST /api/webhooks/ghn
 * GHN gọi về đây mỗi khi trạng thái đơn thay đổi.
 * Cấu hình trong GHN Portal: Settings → Webhook URL → https://yourdomain.com/api/webhooks/ghn
 */
export async function POST(request) {
  try {
    const webhookError = verifyOptionalWebhookSecret(request);
    if (webhookError) return webhookError;

    const body = await request.json();

    // GHN webhook payload
    const { OrderCode, Status, CODAmount, ShippingFee } = body;

    if (!OrderCode) {
      return NextResponse.json({ success: false, error: 'Thiếu OrderCode' }, { status: 400 });
    }

    // Map GHN status → Hship status
    const hshipStatus = GHN_STATUS_MAP[Status] || null;

    // Find order by trackingCode
    const order = await prisma.order.findFirst({
      where: { trackingCode: OrderCode },
    });

    if (!order) {
      // Order not found — log nhưng trả 200 để GHN không retry
      console.warn(`[GHN Webhook] Order not found: ${OrderCode}`);
      return NextResponse.json({ success: true, note: 'Order not found, ignored' });
    }

    // Build update payload
    const updateData = {};
    if (hshipStatus) updateData.status = hshipStatus;
    if (CODAmount)   updateData.codAmount = CODAmount;
    if (ShippingFee) updateData.shippingFee = ShippingFee;

    // Mark deliveredAt / returnedAt timestamps
    if (hshipStatus === 'delivered') updateData.deliveredAt = new Date();
    if (hshipStatus === 'returned')  updateData.returnedAt  = new Date();

    await prisma.order.update({
      where: { id: order.id },
      data:  updateData,
    });

    console.log(`[GHN Webhook] ${OrderCode} → ${Status} → Hship: ${hshipStatus}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[GHN Webhook Error]', error);
    // Trả 200 để GHN không retry liên tục
    return NextResponse.json({ success: false, error: error.message });
  }
}
