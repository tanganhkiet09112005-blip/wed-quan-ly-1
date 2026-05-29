import { prisma } from '@/lib/prisma';
import { isSubAdmin, isSuperAdmin, requireAdmin } from '@/lib/server/auth';
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
    const { user, response } = await requireAdmin();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    const where = {};
    if (status) where.status = status;

    // Role-based filtering:
    // SUPER_ADMIN sees ALL shops (including old shops with adminId = null)
    // Sub-admin sees ONLY shops assigned to them
    if (isSubAdmin(user)) {
      where.adminId = user.id;
    }
    // isSuperAdmin → no adminId filter → sees all

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
        admin: { select: { id: true, name: true, email: true } },
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
    const { user, response } = await requireAdmin();
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

    // Determine admin ownership:
    // - SUPER_ADMIN can pass adminId to assign to sub-admin (or null = owned by super)
    // - Sub-admin always creates shop under themselves
    let assignedAdminId = null;
    if (isSubAdmin(user)) {
      assignedAdminId = user.id;
    } else if (isSuperAdmin(user) && body.adminId) {
      // Verify the target admin is a valid sub-admin
      const targetAdmin = await prisma.user.findUnique({
        where: { id: body.adminId },
        select: { id: true, role: true, parentAdminId: true },
      });
      if (!targetAdmin || targetAdmin.role !== 'admin' || !targetAdmin.parentAdminId) {
        return jsonError('Admin được chọn không hợp lệ.', 400);
      }
      assignedAdminId = body.adminId;
    }

    const result = await prisma.$transaction(async (tx) => {
      const shop = await tx.shop.create({
        data: {
          code,
          name: body.name.trim(),
          ownerName: body.ownerName.trim(),
          email,
          phone: body.phone.trim(),
          status: body.status || 'active',
          adminId: assignedAdminId,
        },
      });

      const userRecord = await tx.user.create({
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

      return { shop, user: { ...userRecord, password: undefined } };
    });

    return jsonSuccess(result, 'Tao tai khoan Shop thanh cong.', 201);
  } catch (error) {
    return serverError('[POST /api/shops]', error);
  }
}
