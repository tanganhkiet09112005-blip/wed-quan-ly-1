import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';
import { summarizeOrders } from '@/lib/server/dashboard-service';

export async function GET(request, { params }) {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const { id } = await params;
    if (!id) return jsonError('Thiếu shop ID.', 400);

    const [shop, orders, products, ecommerceConnections] = await Promise.all([
      prisma.shop.findUnique({
        where: { id },
        include: {
          configs: true,
          _count: { select: { orders: true, users: true, products: true } },
        },
      }),
      prisma.order.findMany({
        where: { shopId: id },
        select: {
          id: true, code: true, status: true, codStatus: true,
          codAmount: true, shippingFee: true, shipperCode: true,
          carrierName: true, shippingName: true, shippingPhone: true,
          channel: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
      prisma.product.findMany({
        where: { shopId: id },
        select: { id: true, name: true, code: true, status: true },
        take: 10,
      }),
      prisma.ecommerceChannelConnection.findMany({
        where: { shopId: id },
        select: { id: true, platform: true, status: true, externalShopId: true, createdAt: true },
      }),
    ]);

    if (!shop) return jsonError('Không tìm thấy shop.', 404);

    const summary = summarizeOrders(orders);
    const recentOrders = orders.slice(0, 10);

    // Mask sensitive config — only return status, not tokens
    const configSafe = shop.configs ? {
      fbStatus: shop.configs.fbStatus,
      misaStatus: shop.configs.misaStatus,
      hasFbPageId: Boolean(shop.configs.fbPageId),
      hasMisaAppId: Boolean(shop.configs.misaAppId),
    } : null;

    return jsonSuccess({
      shop: {
        id: shop.id,
        code: shop.code,
        name: shop.name,
        ownerName: shop.ownerName,
        email: shop.email,
        phone: shop.phone,
        status: shop.status,
        createdAt: shop.createdAt,
        _count: shop._count,
      },
      summary,
      recentOrders,
      products,
      ecommerceConnections,
      config: configSafe,
    });
  } catch (error) {
    return serverError('[GET /api/shops/[id]]', error);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const { id } = await params;
    if (!id) return jsonError('Thiếu shop ID.', 400);

    const body = await request.json();
    const { status } = body;

    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return jsonError('Trạng thái không hợp lệ. Chỉ chấp nhận: active, inactive, suspended.', 400);
    }

    const shop = await prisma.shop.findUnique({ where: { id } });
    if (!shop) return jsonError('Không tìm thấy shop.', 404);

    const updated = await prisma.shop.update({
      where: { id },
      data: { status },
      select: { id: true, code: true, name: true, status: true, updatedAt: true },
    });

    return jsonSuccess(updated, `Đã ${status === 'active' ? 'kích hoạt' : 'tạm khóa'} shop ${shop.name}.`);
  } catch (error) {
    return serverError('[PATCH /api/shops/[id]]', error);
  }
}
