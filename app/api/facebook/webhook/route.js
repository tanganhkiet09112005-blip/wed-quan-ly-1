import { prisma } from '@/lib/prisma';
import { jsonSuccess, jsonError } from '@/lib/server/responses';
import { parseCustomerMessage } from '@/lib/chatbot/parser';
import { decryptSecret } from '@/lib/server/secrets';

// Helper tạo code đơn hàng ngẫu nhiên giống Phase 2
function generateOrderCode() {
  return `DH${String(Date.now()).slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.FACEBOOK_VERIFY_TOKEN || 'hship_verify_token_default';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[Facebook Webhook] Verified successfully.');
    // Trả về hub.challenge dưới dạng văn bản thuần túy theo yêu cầu của Facebook
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  console.warn('[Facebook Webhook] Verification failed. Token mismatch.');
  return new Response('Verification failed', { status: 403 });
}

export async function POST(request) {
  let webhookEventRecord = null;
  try {
    const payload = await request.json();
    console.log('[Facebook Webhook] Received payload:', JSON.stringify(payload));

    // 1. Lưu raw payload vào FacebookWebhookEvent ở trạng thái unprocessed
    const entry = payload.entry?.[0];
    const pageId = entry?.id;
    const messagingEvent = entry?.messaging?.[0] || entry?.changes?.[0];
    const eventId = messagingEvent?.message?.mid || messagingEvent?.value?.comment_id || `ev_${Date.now()}`;
    const eventType = messagingEvent?.message ? 'message' : messagingEvent?.value?.item ? 'comment' : 'unknown';

    webhookEventRecord = await prisma.facebookWebhookEvent.create({
      data: {
        pageId,
        eventId,
        eventType,
        rawPayload: JSON.stringify(payload),
        status: 'unprocessed',
      },
    });

    // 2. Tìm kết nối Fanpage để map với shopId
    const pageConnection = await prisma.facebookPageConnection.findFirst({
      where: {
        pageId,
        status: 'active',
      },
    });

    if (!pageConnection) {
      await prisma.facebookWebhookEvent.update({
        where: { id: webhookEventRecord.id },
        data: {
          status: 'ignored',
          errorMessage: 'Page ID not connected to any active shop in this system.',
        },
      });
      return jsonSuccess({ status: 'ignored' }, 'Page ID is not registered.');
    }

    const shopId = pageConnection.shopId;
    
    // Cập nhật shopId vào record event
    await prisma.facebookWebhookEvent.update({
      where: { id: webhookEventRecord.id },
      data: { shopId },
    });

    // 3. Trích xuất thông tin tin nhắn/bình luận
    let senderId = '';
    let customerName = 'Khách hàng Facebook';
    let textContent = '';
    let channel = 'fanpage';

    if (eventType === 'message') {
      senderId = messagingEvent.sender?.id;
      textContent = messagingEvent.message?.text || '';
    } else if (eventType === 'comment') {
      senderId = messagingEvent.value?.from?.id;
      customerName = messagingEvent.value?.from?.name || customerName;
      textContent = messagingEvent.value?.message || '';
      channel = 'livestream'; // Bình luận thường giả định từ livestream hoặc post bán hàng
    }

    if (!senderId || !textContent) {
      await prisma.facebookWebhookEvent.update({
        where: { id: webhookEventRecord.id },
        data: {
          status: 'ignored',
          errorMessage: 'No sender ID or text content extracted from event.',
        },
      });
      return jsonSuccess({ status: 'ignored' }, 'Ignored due to empty message.');
    }

    // 4. Tìm hoặc tạo ChatSession chưa xác nhận của khách hàng này trong shop
    // Lưu senderId của Facebook vào trường rawComment để đối soát sau
    let session = await prisma.chatSession.findFirst({
      where: {
        shopId,
        channel,
        status: { not: 'confirmed' },
        rawComment: senderId, // Dùng rawComment lưu senderId của khách
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          shopId,
          channel,
          customerName,
          status: 'collecting',
          rawComment: senderId,
        },
      });
    }

    // 5. Lưu tin nhắn của khách vào database
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        sender: 'customer',
        content: textContent,
      },
    });

    // 6. Áp dụng Regex Parser trích xuất thông tin
    const parsed = parseCustomerMessage(textContent);
    const updateSessionData = {};

    if (parsed.phone) {
      updateSessionData.customerPhone = parsed.phone;
    }
    if (parsed.address) {
      updateSessionData.shippingAddress = parsed.address;
    }
    if (parsed.size) {
      updateSessionData.size = parsed.size;
    }
    if (parsed.quantity) {
      updateSessionData.quantity = parsed.quantity;
    }
    if (parsed.productName) {
      updateSessionData.productName = parsed.productName;
    }

    // Cập nhật session thông tin bóc tách được
    let updatedSession = session;
    if (Object.keys(updateSessionData).length > 0) {
      updatedSession = await prisma.chatSession.update({
        where: { id: session.id },
        data: updateSessionData,
      });
    }

    // 7. Xác định thông tin còn thiếu và tạo draft order nếu đủ
    const hasPhone = Boolean(updatedSession.customerPhone);
    const hasAddress = Boolean(updatedSession.shippingAddress);
    const missingFields = [];
    if (!hasPhone) missingFields.push('phone');
    if (!hasAddress) missingFields.push('address');

    await prisma.chatSession.update({
      where: { id: session.id },
      data: {
        missingFields: missingFields.join(','),
      },
    });

    let draftOrder = null;
    let autoReplyText = '';

    // Lấy cấu hình kịch bản chatbot của shop
    let botSettings = await prisma.botSettings.findUnique({
      where: { shopId },
    });
    if (!botSettings) {
      botSettings = {
        botEnabled: true,
        autoReply: false,
        welcomeMessage: 'Chào bạn! Cảm ơn bạn đã quan tâm. Bạn cho shop xin SĐT và địa chỉ giao hàng nhé!',
        missingPhoneMessage: 'Bạn vui lòng cung cấp Số điện thoại nhé ạ!',
        missingAddressMessage: 'Bạn cho shop xin địa chỉ nhận hàng chi tiết nhé!',
        orderConfirmMessage: 'Cảm ơn bạn! Shop đã tạo đơn hàng nháp. Bạn vui lòng kiểm tra và xác nhận nhé!',
      };
    }

    if (missingFields.length > 0) {
      // Còn thiếu thông tin
      if (botSettings.botEnabled) {
        if (!hasPhone) {
          autoReplyText = botSettings.missingPhoneMessage;
        } else if (!hasAddress) {
          autoReplyText = botSettings.missingAddressMessage;
        }
      }
    } else if (updatedSession.status === 'collecting') {
      // Đủ thông tin SĐT + Địa chỉ -> Tạo draft order nếu chưa có
      const orderCode = generateOrderCode();
      const value = 250000; // Giả định giá mặc định của sản phẩm hoặc tính toán
      
      draftOrder = await prisma.order.create({
        data: {
          code: orderCode,
          status: 'draft',
          totalValue: value,
          codAmount: value,
          shippingName: updatedSession.customerName || 'Khách hàng Facebook',
          shippingPhone: updatedSession.customerPhone,
          shippingAddress: updatedSession.shippingAddress,
          channel,
          shopId,
        },
      });

      // Liên kết draft order vào chat session
      await prisma.chatSession.update({
        where: { id: session.id },
        data: {
          status: 'draft_created',
          draftOrderId: draftOrder.id,
        },
      });

      if (botSettings.botEnabled) {
        autoReplyText = `${botSettings.orderConfirmMessage}\n Mã đơn nháp: ${orderCode}\n SĐT: ${updatedSession.customerPhone}\n Địa chỉ: ${updatedSession.shippingAddress}`;
      }
    }

    // 8. Tự động trả lời qua Facebook API thật nếu bật và có nội dung trả lời
    let apiCallResult = 'skipped';
    if (autoReplyText && botSettings.botEnabled) {
      // Lưu tin nhắn Bot phản hồi vào DB
      await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          sender: 'bot',
          content: autoReplyText,
        },
      });

      // Gọi API gửi tin nhắn của Facebook
      const decryptedPageToken = decryptSecret(pageConnection.accessToken);
      if (decryptedPageToken && eventType === 'message') {
        try {
          const fbResponse = await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${decryptedPageToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient: { id: senderId },
              message: { text: autoReplyText },
            }),
          });
          const fbData = await fbResponse.json();
          if (fbData.error) {
            console.error('[Facebook Send Message Error]', fbData.error);
            apiCallResult = `failed: ${fbData.error.message}`;
          } else {
            apiCallResult = 'success';
          }
        } catch (fetchErr) {
          console.error('[Facebook Webhook API call failed]', fetchErr);
          apiCallResult = `failed: ${fetchErr.message}`;
        }
      }
    }

    // 9. Cập nhật trạng thái sự kiện thành công
    await prisma.facebookWebhookEvent.update({
      where: { id: webhookEventRecord.id },
      data: {
        status: 'processed',
        errorMessage: apiCallResult !== 'success' && apiCallResult !== 'skipped' ? `Facebook API call: ${apiCallResult}` : null,
      },
    });

    return jsonSuccess({
      status: 'processed',
      sessionId: session.id,
      sessionStatus: updatedSession.status,
      draftOrderId: draftOrder?.id || null,
      botReplied: Boolean(autoReplyText),
      facebookApiCall: apiCallResult,
    });
  } catch (error) {
    console.error('[Facebook Webhook POST Error]', error);
    if (webhookEventRecord) {
      await prisma.facebookWebhookEvent.update({
        where: { id: webhookEventRecord.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
        },
      });
    }
    // Trả về 200 để Facebook không gửi lại webhook liên tục gây quá tải
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
