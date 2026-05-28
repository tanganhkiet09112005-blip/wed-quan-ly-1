import { prisma } from '@/lib/prisma';
import { getScopedShopId, isAdmin, requireShopOrAdmin } from '@/lib/server/auth';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';
import { generateCustomerCode, normalizePhone } from '@/lib/server/order-service';

function validateCustomerPayload(body) {
  const errors = {};
  if (!body.name?.trim()) errors.name = 'Ten khach hang la bat buoc.';
  if (!normalizePhone(body.phone)) errors.phone = 'So dien thoai la bat buoc.';
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email).trim())) {
    errors.email = 'Email khong hop le.';
  }
  return errors;
}

export async function GET(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const scopedShopId = getScopedShopId(user, searchParams.get('shopId'));

    if (!isAdmin(user) && !scopedShopId) {
      return jsonError('Tai khoan shop chua duoc gan shopId.', 403);
    }

    const where = {};
    if (scopedShopId) where.shopId = scopedShopId;
    if (searchParams.get('status')) where.status = searchParams.get('status');
    if (searchParams.get('search')) {
      const search = searchParams.get('search');
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { code: { contains: search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: { _count: { select: { orders: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return jsonSuccess(customers);
  } catch (error) {
    return serverError('[GET /api/customers]', error);
  }
}

export async function POST(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const body = await request.json();
    const errors = validateCustomerPayload(body);
    if (Object.keys(errors).length > 0) {
      return jsonError('Du lieu khach hang khong hop le.', 400, errors);
    }

    const scopedShopId = isAdmin(user) ? body.shopId || null : user.shopId;
    if (!scopedShopId) return jsonError('Thieu shopId de tao khach hang.', 400);

    const phone = normalizePhone(body.phone);
    const existing = await prisma.customer.findUnique({
      where: {
        shopId_phone: {
          shopId: scopedShopId,
          phone,
        },
      },
    });
    if (existing) return jsonSuccess(existing, 'Khach hang da ton tai trong shop.');

    const customer = await prisma.customer.create({
      data: {
        code: generateCustomerCode(),
        name: body.name.trim(),
        phone,
        email: body.email?.trim() || null,
        address: body.address?.trim() || '',
        status: body.status || 'active',
        blacklistReason: body.blacklistReason || null,
        shopId: scopedShopId,
      },
    });

    return jsonSuccess(customer, 'Tao khach hang thanh cong.', 201);
  } catch (error) {
    if (error?.code === 'P2002') {
      return jsonError('Khach hang voi so dien thoai nay da ton tai trong shop.', 409);
    }
    return serverError('[POST /api/customers]', error);
  }
}
