import { prisma } from '@/lib/prisma';
import { requireShopOrAdmin, sanitizeUser } from '@/lib/server/auth';
import { hashPassword, verifyPassword } from '@/lib/server/password';
import { jsonError, jsonSuccess, serverError } from '@/lib/server/responses';

export async function GET() {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { shop: true },
    });

    if (!fullUser) return jsonError('Khong tim thay tai khoan nguoi dung.', 404);
    return jsonSuccess(sanitizeUser(fullUser));
  } catch (error) {
    return serverError('[GET /api/auth/profile]', error);
  }
}

export async function PUT(request) {
  try {
    const { user, response } = await requireShopOrAdmin();
    if (response) return response;

    if (!user.shopId) {
      return jsonError('Tai khoan nay khong gan voi shop nao.', 400);
    }

    const body = await request.json();
    const { name, shopName, ownerName, phone, currentPassword, newPassword } = body;

    const errors = {};
    if (!name?.trim()) errors.name = 'Ho ten la bat buoc.';
    if (!shopName?.trim()) errors.shopName = 'Ten shop la bat buoc.';
    if (!ownerName?.trim()) errors.ownerName = 'Ten chu shop la bat buoc.';
    if (!phone?.trim()) errors.phone = 'So dien thoai la bat buoc.';
    if (!currentPassword) errors.currentPassword = 'Mat khau hien tai la bat buoc.';
    if (newPassword && String(newPassword).length < 6) {
      errors.newPassword = 'Mat khau moi phai co it nhat 6 ky tu.';
    }

    if (Object.keys(errors).length > 0) {
      return jsonError('Du lieu khong hop le.', 400, errors);
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { shop: true },
    });

    if (!dbUser) return jsonError('Khong tim thay tai khoan nguoi dung.', 404);
    if (dbUser.shopId !== user.shopId) {
      return jsonError('Ban khong co quyen chinh sua cua hang nay.', 403);
    }

    const passwordResult = await verifyPassword(currentPassword, dbUser.password);
    if (!passwordResult.valid) {
      return jsonError('Mat khau hien tai khong chinh xac.', 401);
    }

    const updatedUserData = await prisma.$transaction(async (tx) => {
      const userUpdateFields = { name: name.trim() };

      if (newPassword?.trim()) {
        userUpdateFields.password = await hashPassword(newPassword.trim());
      } else if (passwordResult.needsRehash) {
        userUpdateFields.password = await hashPassword(currentPassword);
      }

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: userUpdateFields,
      });

      const updatedShop = await tx.shop.update({
        where: { id: user.shopId },
        data: {
          name: shopName.trim(),
          ownerName: ownerName.trim(),
          phone: phone.trim(),
        },
      });

      return {
        ...updatedUser,
        shop: {
          id: updatedShop.id,
          code: updatedShop.code,
          name: updatedShop.name,
          status: updatedShop.status,
        },
      };
    });

    return jsonSuccess(sanitizeUser(updatedUserData), 'Cap nhat tai khoan va thong tin cua hang thanh cong.');
  } catch (error) {
    return serverError('[PUT /api/auth/profile]', error);
  }
}
