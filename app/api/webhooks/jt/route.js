import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { JT_STATUS_MAP } from '@/lib/carriers/jt';
import { verifyOptionalWebhookSecret } from '@/lib/server/webhook';

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "J&T webhook",
    method: "POST required",
    message: "Webhook endpoint is live. J&T should send POST requests to this URL."
  });
}

export async function POST(request) {
  try {
    const webhookError = verifyOptionalWebhookSecret(request);
    if (webhookError) {
      return NextResponse.json({ status: false, message: 'Unauthorized' }, { status: 401 });
    }

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
    const remark = body.desc || body.remark || body.status_name;
    const totalFee = body.totalfee || body.fee || body.freightfee;

    if (!billcode) {
      return NextResponse.json({ status: false, message: 'Thiếu billcode' }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: { trackingCode: billcode },
    });

    if (!order) {
      // Don't leak DB info, just ignore
      return NextResponse.json({ status: true });
    }

    const hshipStatus = JT_STATUS_MAP[String(statusCode)] || null;
    const updateData  = {};

    if (hshipStatus)  updateData.status      = hshipStatus;
    if (totalFee)     updateData.shippingFee = parseFloat(totalFee);
    if (hshipStatus === 'delivered') updateData.deliveredAt = new Date();
    if (hshipStatus === 'returned')  updateData.returnedAt  = new Date();
    if (remark)       updateData.note = [order.note, `[J&T] ${remark}`].filter(Boolean).join(' | ');

    await prisma.order.update({ where: { id: order.id }, data: updateData });

    return NextResponse.json({ status: true });

  } catch (error) {
    return NextResponse.json({ status: false, message: 'Unauthorized' }, { status: 500 }); // Obfuscated internal error
  }
}
