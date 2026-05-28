import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getScopedShopId, isAdmin, requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';
import {
  calculateOrderTotal,
  applyInventoryRuleForOrderStatus,
  generateOrderCode,
  getOrderInclude,
  resolveOrderCustomer,
  resolveOrderItems,
} from '@/lib/server/order-service';
import { normalizeOrderForResponse } from '@/lib/order-constants';

export async function POST(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const body = await request.json();
    const shopId = isAdmin(user) ? body.shopId || null : user.shopId;
    if (!shopId) {
      return jsonError('Thiếu shopId để thanh toán đơn POS.', isAdmin(user) ? 400 : 403);
    }

    const { items, customerName, phone, note, paymentMethod } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return jsonError('Giỏ hàng cần có ít nhất một sản phẩm.', 400);
    }

    // Validate structure of items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.variantId) {
        return jsonError(`Sản phẩm dòng ${i + 1} phải chọn đúng SKU / phân loại.`, 400);
      }
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return jsonError(`Số lượng sản phẩm dòng ${i + 1} phải lớn hơn 0.`, 400);
      }
    }

    const finalOrder = await prisma.$transaction(async (tx) => {
      // Resolve items and validate stock
      const itemResult = await resolveOrderItems(tx, shopId, items, { requireStock: true });
      if (itemResult.error) {
        throw new Error(itemResult.error);
      }

      const normalizedItems = itemResult.items;
      const totalValue = calculateOrderTotal(normalizedItems);

      // Resolve customer
      const customerPayload = {
        shippingName: (customerName || '').trim() || 'Khách lẻ POS',
        shippingPhone: (phone || '').trim() || 'POS',
        shippingAddress: 'Bán tại quầy',
      };
      const customerResult = await resolveOrderCustomer(tx, shopId, customerPayload);
      if (customerResult.error) {
        throw new Error(customerResult.error);
      }

      const methodLabel = paymentMethod === 'transfer' ? 'Chuyển khoản' : paymentMethod === 'card' ? 'Quẹt thẻ' : 'Tiền mặt';
      const orderNote = [
        note?.trim(),
        `Bán tại quầy (POS) - ${methodLabel}`
      ].filter(Boolean).join(' · ');

      // Create Delivered POS Order
      const createdOrder = await tx.order.create({
        data: {
          code: generateOrderCode(),
          status: 'delivered',
          codStatus: 'collected',
          codCollectedAt: new Date(),
          deliveredAt: new Date(),
          channel: 'pos',
          shippingName: customerPayload.shippingName,
          shippingPhone: customerPayload.shippingPhone,
          shippingAddress: customerPayload.shippingAddress,
          codAmount: totalValue,
          shippingFee: 0,
          carrierFee: 0,
          totalValue,
          note: orderNote,
          customerId: customerResult.customerId,
          shopId,
          items: {
            create: normalizedItems.map(i => ({
              name: i.name,
              quantity: i.quantity,
              price: i.price,
              unitPrice: i.unitPrice,
              lineTotal: i.lineTotal,
              sku: i.sku,
              productCode: i.productCode,
              productName: i.productName,
              variantName: i.variantName,
              size: i.size,
              color: i.color,
              productId: i.productId,
              variantId: i.variantId,
            }))
          },
        },
        include: getOrderInclude(isAdmin(user)),
      });

      // Apply inventory deduction rule using standard stock logic
      await applyInventoryRuleForOrderStatus(tx, createdOrder.id, createdOrder.status, 'Bán tại quầy POS');

      return tx.order.findUnique({
        where: { id: createdOrder.id },
        include: getOrderInclude(isAdmin(user)),
      });
    });

    return jsonSuccess(
      normalizeOrderForResponse(finalOrder),
      'Thanh toán đơn hàng tại quầy thành công.'
    );
  } catch (error) {
    if (
      error.message?.includes('SKU') ||
      error.message?.includes('không đủ') ||
      error.message?.includes('không thuộc shop')
    ) {
      return jsonError(error.message, 400);
    }
    return serverError('[POST /api/pos/checkout]', error);
  }
}
