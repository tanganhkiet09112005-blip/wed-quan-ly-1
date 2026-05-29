import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getScopedShopId, isAdmin, requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, serverError } from '@/lib/server/responses';
import { determineOrderFlow } from '@/lib/server/flow-engine';
import {
  calculateOrderTotal,
  applyInventoryRuleForOrderStatus,
  generateOrderCode,
  getOrderInclude,
  normalizeOrdersForResponse,
  resolveOrderItems,
  resolveOrderCustomer,
  validateOrderPayload,
} from '@/lib/server/order-service';
import {
  COD_STATUSES,
  ORDER_STATUSES,
  normalizeCodStatus,
  normalizeOrderForResponse,
  normalizeOrderStatus,
} from '@/lib/order-constants';

function normalizePagination(searchParams) {
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

function parseList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseDateBoundary(value, endOfDay = false) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    date.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  }
  return date;
}

function buildOrdersWhere(searchParams, scopedShopId) {
  const where = {};
  const and = [];

  if (scopedShopId) where.shopId = scopedShopId;

  const statuses = parseList(searchParams.get('status'))
    .map((status) => normalizeOrderStatus(status))
    .filter((status) => ORDER_STATUSES.includes(status));
  if (statuses.length === 1) where.status = statuses[0];
  if (statuses.length > 1) where.status = { in: statuses };

  const codStatuses = parseList(searchParams.get('codStatus'))
    .map((status) => normalizeCodStatus(status))
    .filter((status) => COD_STATUSES.includes(status));
  if (codStatuses.length === 1) where.codStatus = codStatuses[0];
  if (codStatuses.length > 1) where.codStatus = { in: codStatuses };

  const channel = searchParams.get('channel');
  if (channel) where.channel = channel;

  const carrierCode = searchParams.get('carrierCode')?.trim().toUpperCase();
  if (carrierCode) {
    and.push({
      OR: [
        { shipperCode: carrierCode },
        { carrierName: { contains: carrierCode } },
        { trackingCode: { contains: carrierCode } },
      ],
    });
  }

  const dateFrom = parseDateBoundary(searchParams.get('dateFrom'));
  const dateTo = parseDateBoundary(searchParams.get('dateTo'), true);
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = dateFrom;
    if (dateTo) where.createdAt.lte = dateTo;
  }

  const search = searchParams.get('search')?.trim();
  if (search) {
    and.push({
      OR: [
        { code: { contains: search } },
        { shippingName: { contains: search } },
        { shippingPhone: { contains: search } },
        { trackingCode: { contains: search } },
        { carrierName: { contains: search } },
      ],
    });
  }

  if (and.length > 0) where.AND = and;
  return where;
}

function buildFacetWhere(where) {
  const { status: _status, ...facetWhere } = where;
  return facetWhere;
}

function normalizeGroupCounts(groups, normalizer) {
  return groups.reduce((acc, group) => {
    const key = normalizer(group.status || group.codStatus);
    acc[key] = (acc[key] || 0) + group._count._all;
    return acc;
  }, {});
}

export async function GET(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const scopedShopId = getScopedShopId(user, searchParams.get('shopId'));
    const { page, limit, skip } = normalizePagination(searchParams);

    if (!isAdmin(user) && !scopedShopId) {
      return jsonError('Tai khoan shop chua duoc gan shopId.', 403);
    }

    const where = buildOrdersWhere(searchParams, scopedShopId);
    const facetWhere = buildFacetWhere(where);

    const [orders, total, statusGroups, codStatusGroups] = await Promise.all([
      prisma.order.findMany({
        where,
        include: getOrderInclude(isAdmin(user)),
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
      prisma.order.groupBy({
        by: ['status'],
        where: facetWhere,
        _count: { _all: true },
      }),
      prisma.order.groupBy({
        by: ['codStatus'],
        where: facetWhere,
        _count: { _all: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'OK',
      data: normalizeOrdersForResponse(orders),
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      facets: {
        byStatus: normalizeGroupCounts(statusGroups, normalizeOrderStatus),
        byCodStatus: normalizeGroupCounts(codStatusGroups, normalizeCodStatus),
      },
    });
  } catch (error) {
    return serverError('[GET /api/orders]', error);
  }
}

export async function POST(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const body = await request.json();
    const errors = validateOrderPayload(body);
    if (Object.keys(errors).length > 0) {
      return jsonError('Du lieu don hang khong hop le.', 400, errors);
    }

    const scopedShopId = isAdmin(user) ? body.shopId || null : user.shopId;
    if (!scopedShopId) return jsonError('Thieu shopId de tao don hang.', isAdmin(user) ? 400 : 403);

    let normalizedItems = [];
    let codAmount = 0;

    let order = await prisma.$transaction(async (tx) => {
      const itemResult = await resolveOrderItems(tx, scopedShopId, body.items, { requireStock: true });
      if (itemResult.error) throw new Error(itemResult.error);
      normalizedItems = itemResult.items;
      const nextTotalValue = calculateOrderTotal(normalizedItems);
      codAmount = body.codAmount !== undefined && body.codAmount !== ''
        ? Number(body.codAmount)
        : nextTotalValue;

      const customerResult = await resolveOrderCustomer(tx, scopedShopId, body);
      if (customerResult.error) throw new Error(customerResult.error);

      // Fetch contexts for flow engine
      const shop = await tx.shop.findUnique({ where: { id: scopedShopId } });
      const customer = await tx.customer.findUnique({ where: { id: customerResult.customerId } });
      const carrierCredentials = await tx.shopShipper.findMany({ where: { shopId: scopedShopId, status: 'active' } });
      const rules = await tx.orderFlowRule.findMany({ where: { shopId: scopedShopId, isActive: true }, orderBy: { priority: 'asc' } });
      
      // Verify Pricing
      let pricingResult = null;
      let finalShippingFee = body.shippingFee ? Number(body.shippingFee) : 0;
      let finalAppliedTierId = body.appliedRateTierId || null;

      const rate = await tx.shopShippingRate.findFirst({
        where: { shopId: scopedShopId, isActive: true },
        include: { tiers: { orderBy: { minWeight: 'asc' } } }
      });

      if (rate && rate.tiers.length > 0) {
        if (!body.weight || isNaN(Number(body.weight)) || Number(body.weight) < 0) {
          pricingResult = { hasRate: false };
        } else {
          const weight = Number(body.weight);
          const matchedTier = rate.tiers.find(t => weight >= t.minWeight && weight <= t.maxWeight);
          if (matchedTier) {
            pricingResult = { hasRate: true, fee: matchedTier.price, tierId: matchedTier.id };
            finalShippingFee = matchedTier.price;
            finalAppliedTierId = matchedTier.id;
          } else {
            pricingResult = { hasRate: false };
          }
        }
      } else {
        // No active rate plan configured for shop
        pricingResult = { hasRate: false };
      }

      // Determine Flow
      const flowInfo = determineOrderFlow({
        orderInput: body,
        shop,
        customer,
        pricingResult,
        carrierCredentials,
        rules
      });

      const createdOrder = await tx.order.create({
        data: {
          code: generateOrderCode(),
          shippingName: body.shippingName.trim(),
          shippingPhone: body.shippingPhone.trim(),
          shippingAddress: body.shippingAddress.trim(),
          channel: body.channel || 'direct',
          codAmount,
          shippingFee: finalShippingFee,
          carrierFee: finalShippingFee,
          weight: body.weight ? Number(body.weight) : null,
          appliedRateTierId: finalAppliedTierId,
          totalValue: nextTotalValue,
          note: body.note || null,
          customerId: customerResult.customerId,
          shopId: scopedShopId,
          status: 'pending',
          codStatus: 'pending',
          items: { create: normalizedItems },
          
          // Flow fields
          flowStatus: flowInfo.flowStatus,
          flowMessage: flowInfo.flowMessage,
          flowRuleId: flowInfo.flowRuleId,
          carrierCode: flowInfo.carrierCode,
          carrierStatus: null
        },
        include: getOrderInclude(isAdmin(user)),
      });

      // Log the flow
      await tx.orderFlowLog.create({
        data: {
          orderId: createdOrder.id,
          toStatus: flowInfo.flowStatus,
          message: flowInfo.flowMessage,
          actorUserId: user.id
        }
      });

      await applyInventoryRuleForOrderStatus(tx, createdOrder.id, createdOrder.status, 'Tru ton khi tao don');
      
      return { order: createdOrder, shop, flowInfo };
    });

    // Auto-push logic if enabled and ready
    let carrierResult = null;
    let finalOrder = orderResult.order;
    
    if (orderResult.flowInfo.flowStatus === 'READY_TO_PUSH' && orderResult.shop?.autoPushCarrierEnabled && orderResult.flowInfo.carrierCode) {
      const { pushOrderToCarrier } = await import('@/lib/carriers/index');
      carrierResult = await pushOrderToCarrier(orderResult.flowInfo.carrierCode, {
        ...finalOrder,
        shopId: scopedShopId,
        items: normalizedItems,
      });

      if (carrierResult?.success && carrierResult.trackingCode) {
        finalOrder = await prisma.order.update({
          where: { id: finalOrder.id },
          data: {
            trackingCode: carrierResult.trackingCode,
            shippingFee: carrierResult.fee || finalOrder.shippingFee,
            carrierFee: carrierResult.fee || finalOrder.carrierFee,
            carrierName: carrierResult.carrierName || null,
            status: 'pushed_to_carrier',
            codStatus: 'collecting',
            flowStatus: 'PUSHED_TO_CARRIER',
            pushedAt: new Date()
          },
          include: getOrderInclude(isAdmin(user)),
        });

        await prisma.orderFlowLog.create({
          data: {
            orderId: finalOrder.id,
            fromStatus: 'READY_TO_PUSH',
            toStatus: 'PUSHED_TO_CARRIER',
            message: 'Tự động đẩy đơn qua vận chuyển.',
            actorUserId: user.id
          }
        });
      } else {
         finalOrder = await prisma.order.update({
          where: { id: finalOrder.id },
          data: {
            flowStatus: 'PUSH_FAILED',
            pushError: carrierResult?.error || 'Lỗi không xác định khi đẩy đơn.'
          },
          include: getOrderInclude(isAdmin(user)),
        });
      }
    }

    return Response.json({
      success: true,
      message: 'Tao don hang thanh cong.',
      data: normalizeOrderForResponse(finalOrder),
      carrier: carrierResult,
    }, { status: 201 });
  } catch (error) {
    if (error?.message === 'Khach hang khong thuoc shop hien tai.') {
      return jsonError(error.message, 403);
    }
    if (
      error?.message?.includes('SKU')
      || error?.message?.includes('So luong')
      || error?.message?.includes('Don gia')
      || error?.message?.includes('Ten san pham')
    ) {
      return jsonError(error.message, error.message.includes('khong thuoc shop') ? 403 : 400);
    }
    return serverError('[POST /api/orders]', error);
  }
}
