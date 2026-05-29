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
    if (webhookError) {
      return NextResponse.json({ status: false, message: 'Unauthorized' }, { status: 401 });
    }

    // JT sends data as JSON or form-data
    let body;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      const formData = await request.formData();
      const logistics_interface = formData.get('logistics_interface');
      if (logistics_interface) {
        body = JSON.parse(logistics_interface);
      } else {
        body = Object.fromEntries(formData.entries());
      }
    }

    // J&T STANDARD webhook payload format
    const billcode = body.billcode;
    const statusCode = body.status_code || body.scantype;
    const remark = body.desc || body.remark;
    const freightfee = body.freightfee;

    if (!billcode) {
      return NextResponse.json({ status: false, message: 'Thiếu billcode' }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: { trackingCode: billcode },
    });

    if (!order) {
      console.warn(`[J&T Webhook] Order not found: ${billcode}`);
      return NextResponse.json({ status: true, message: 'Order not found, ignored' });
    }

    const hshipStatus = JT_STATUS_MAP[String(statusCode)] || null;
    const updateData  = {};

    if (hshipStatus)  updateData.status      = hshipStatus;
    if (freightfee)   updateData.shippingFee = parseFloat(freightfee);
    if (hshipStatus === 'delivered') updateData.deliveredAt = new Date();
    if (hshipStatus === 'returned')  updateData.returnedAt  = new Date();
    if (remark)       updateData.note = [order.note, `[J&T] ${remark}`].filter(Boolean).join(' | ');

    await prisma.order.update({ where: { id: order.id }, data: updateData });

    console.log(`[J&T Webhook] ${billcode} → ${statusCode} → Hship: ${hshipStatus}`);
    
    // Response thành công theo chuẩn J&T API STANDARD
    return NextResponse.json({ status: true });

  } catch (error) {
    console.error('[J&T Webhook Error]', error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
