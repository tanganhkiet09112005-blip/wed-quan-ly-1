import { prisma } from '@/lib/prisma';

/**
 * Checks if an order should auto-issue an invoice.
 */
export async function shouldAutoIssueInvoice(order, shop) {
  if (!shop?.autoIssueInvoiceEnabled) return false;
  if (order.status !== 'delivered') return false;
  if (order.invoiceStatus !== 'NOT_ISSUED' && order.invoiceStatus !== 'FAILED' && order.invoiceStatus !== 'MISSING_CREDENTIALS') {
    return false;
  }
  return true;
}

export async function buildInvoicePayload(order, shop) {
  return {
    orderCode: order.code,
    customerName: order.shippingName,
    customerPhone: order.shippingPhone,
    customerAddress: order.shippingAddress,
    goodsContent: order.goodsContent,
    weight: order.weight,
    totalValue: order.totalValue,
    shippingFee: order.shippingFee,
    codAmount: order.codAmount,
    carrierName: order.carrierName || order.shipperCode,
    trackingCode: order.trackingCode,
  };
}

export async function callInvoiceProvider(provider, mode, payload, shopConfig) {
  if (mode === 'MOCK') {
    return { success: true, invoiceId: 'MOCK-' + Date.now(), invoiceNumber: 'INV-' + Date.now(), message: 'Mock invoice issued successfully.' };
  }

  // PRODUCTION MODE
  if (!shopConfig?.hasMisaAppId) { // Check real credentials flag
    return { success: false, missingCredentials: true, error: 'Thiếu cấu hình MISA/VNPT production' };
  }

  // Normally we would call real MISA/VNPT API here.
  // For this delivery we pretend the API is called if credentials are valid.
  // But since we can't fake success without credentials, this is just a placeholder.
  return { success: false, error: 'Chưa hỗ trợ API provider thực tế' };
}

export async function issueInvoiceForOrder(orderId, options = {}) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { shop: { include: { configs: true } }, items: true }
    });

    if (!order) return { success: false, error: 'Order not found' };

    // If auto triggered, check settings
    if (options.trigger === 'ORDER_DELIVERED') {
      const shouldIssue = await shouldAutoIssueInvoice(order, order.shop);
      if (!shouldIssue) return { success: false, reason: 'Conditions not met for auto issue' };
    } else {
      // Manual trigger - check if already issued
      if (order.invoiceStatus === 'ISSUED' || order.invoiceStatus === 'MOCK_ISSUED') {
        return { success: false, error: 'Hóa đơn đã được xuất.' };
      }
    }

    const payload = await buildInvoicePayload(order, order.shop);
    const providerResult = await callInvoiceProvider(
      order.shop.invoiceProvider || 'MISA',
      order.shop.invoiceMode,
      payload,
      order.shop.configs
    );

    if (providerResult.missingCredentials) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          invoiceStatus: 'MISSING_CREDENTIALS',
          invoiceError: providerResult.error,
          invoiceAutoIssued: options.trigger === 'ORDER_DELIVERED',
        }
      });
      return { success: false, error: providerResult.error };
    }

    if (!providerResult.success) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          invoiceStatus: 'FAILED',
          invoiceError: providerResult.error,
          invoiceAutoIssued: options.trigger === 'ORDER_DELIVERED',
        }
      });
      return { success: false, error: providerResult.error };
    }

    // Success
    const newStatus = order.shop.invoiceMode === 'MOCK' ? 'MOCK_ISSUED' : 'ISSUED';
    
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          invoiceStatus: newStatus,
          invoiceId: providerResult.invoiceId,
          invoiceNumber: providerResult.invoiceNumber,
          invoiceIssuedAt: new Date(),
          invoiceProvider: order.shop.invoiceProvider || 'MISA',
          invoiceError: null,
          invoiceAutoIssued: options.trigger === 'ORDER_DELIVERED',
        }
      });

      await tx.invoice.create({
        data: {
          shopId: order.shopId,
          orderId: order.id,
          code: providerResult.invoiceNumber || ('INV-' + Date.now()),
          status: 'issued', // or mock
          customerName: order.shippingName,
          customerPhone: order.shippingPhone,
          customerAddress: order.shippingAddress,
          subtotal: order.totalValue,
          total: order.totalValue,
          issuedAt: new Date(),
          provider: order.shop.invoiceProvider || 'MISA',
          providerInvoiceId: providerResult.invoiceId,
          items: {
            create: order.items.map(i => ({
              name: i.name,
              quantity: i.quantity,
              unitPrice: i.price || i.unitPrice,
              lineTotal: (i.price || i.unitPrice) * i.quantity
            }))
          }
        }
      });
    });

    return { success: true, message: 'Xuất hóa đơn thành công.' };
  } catch (error) {
    console.error('Error issuing invoice:', error);
    return { success: false, error: error.message };
  }
}
