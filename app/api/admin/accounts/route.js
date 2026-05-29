import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/server/auth';
import { hashPassword } from '@/lib/server/password';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';

// GET /api/admin/accounts — List sub-admins (SUPER_ADMIN only)
export async function GET(request) {
  try {
    const { response } = await requireSuperAdmin();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status');

    const where = {
      role: 'admin',
      parentAdminId: { not: null }, // Only sub-admins
    };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const subAdmins = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        parentAdminId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { managedShops: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return jsonSuccess(subAdmins, 'OK');
  } catch (error) {
    return serverError('[GET /api/admin/accounts]', error);
  }
}

// POST /api/admin/accounts — Create sub-admin (SUPER_ADMIN only)
export async function POST(request) {
  try {
    const { user, response } = await requireSuperAdmin();
    if (response) return response;

    const body = await request.json();
    const { name, email, password } = body;

    const errors = {};
    if (!name?.trim()) errors.name = 'Tên Admin là bắt buộc.';
    if (!email?.trim()) errors.email = 'Email là bắt buộc.';
    if (!password || password.length < 6) errors.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Email không hợp lệ.';
    }

    if (Object.keys(errors).length > 0) {
      return jsonError('Dữ liệu không hợp lệ.', 400, errors);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return jsonError(`Email "${normalizedEmail}" đã tồn tại trong hệ thống.`, 409);
    }

    const newAdmin = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: await hashPassword(password),
        role: 'admin',
        parentAdminId: user.id, // Link to creating super admin
        status: 'active',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        parentAdminId: true,
        status: true,
        createdAt: true,
      },
    });

    return jsonSuccess(newAdmin, 'Tạo Admin con thành công.', 201);
  } catch (error) {
    return serverError('[POST /api/admin/accounts]', error);
  }
}
