import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server/auth';
import { hashPassword } from '@/lib/server/password';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';

function validateShopPayload(body) {
  const errors = {};
  if (!body.code?.trim()) errors.code = 'Ma shop la bat buoc.';
  if (!body.name?.trim()) errors.name = 'Ten shop la bat buoc.';
  if (!body.ownerName?.trim()) errors.ownerName = 'Ten chu shop la bat buoc.';
  if (!body.email?.trim()) errors.email = 'Email dang nhap la bat buoc.';
  if (!body.phone?.trim()) errors.phone = 'So dien thoai la bat buoc.';
  if (!body.password || String(body.password).length < 6) {
    errors.password = 'Mat khau phai co it nhat 6 ky tu.';
  }
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email).trim())) {
    errors.email = 'Email khong hop le.';
  }
  return errors;
}

export async function GET(request) {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { ownerName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const shops = await prisma.shop.findMany({
      where,
      include: {
        _count: {
          select: { orders: true, users: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return jsonSuccess(shops);
  } catch (error) {
    return serverError('[GET /api/shops]', error);
  }
}

export async function POST(request) {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const body = await request.json();
    const errors = validateShopPayload(body);
    if (Object.keys(errors).length > 0) {
      return jsonError('Du lieu shop khong hop le.', 400, errors);
    }

    const code = body.code.trim().toUpperCase();
    const email = body.email.trim().toLowerCase();

    const [existingShopCode, existingShopEmail, existingUserEmail] = await Promise.all([
      prisma.shop.findUnique({ where: { code } }),
      prisma.shop.findUnique({ where: { email } }),
      prisma.user.findUnique({ where: { email } }),
    ]);

    if (existingShopCode) return jsonError(`Ma Shop "${code}" da duoc su dung.`, 409);
    if (existingShopEmail || existingUserEmail) return jsonError(`Email "${email}" da ton tai trong he thong.`, 409);

    const result = await prisma.$transaction(async (tx) => {
      const shop = await tx.shop.create({
        data: {
          code,
          name: body.name.trim(),
          ownerName: body.ownerName.trim(),
          email,
          phone: body.phone.trim(),
          status: body.status || 'active',
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          name: body.ownerName.trim(),
          password: await hashPassword(body.password),
          role: 'customer',
          shopId: shop.id,
        },
      });

      await tx.shopConfig.create({
        data: {
          shopId: shop.id,
          fbStatus: 'inactive',
          misaStatus: 'inactive',
        },
      });

      return { shop, user: { ...user, password: undefined } };
    });

    return jsonSuccess(result, 'Tao tai khoan Shop thanh cong.', 201);
  } catch (error) {
    return serverError('[POST /api/shops]', error);
  }
}
