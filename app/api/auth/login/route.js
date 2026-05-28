import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizeUser } from '@/lib/server/auth';
import { hashPassword, verifyPassword } from '@/lib/server/password';
import { jsonError, serverError } from '@/lib/server/responses';
import { createSessionToken, getSessionCookieOptions, SESSION_COOKIE_NAME } from '@/lib/server/session';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return jsonError('Vui long nhap email va mat khau.', 400, {
        email: !email ? 'Email la bat buoc.' : undefined,
        password: !password ? 'Mat khau la bat buoc.' : undefined,
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return jsonError('Email khong hop le.', 400, { email: 'Email khong hop le.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { shop: { select: { id: true, code: true, name: true, status: true } } },
    });

    if (!user) return jsonError('Email hoac mat khau khong dung.', 401);
    if (user.shopId && user.shop?.status !== 'active') {
      return jsonError('Tai khoan shop dang bi tam khoa.', 403);
    }

    const passwordResult = await verifyPassword(password, user.password);
    if (!passwordResult.valid) return jsonError('Email hoac mat khau khong dung.', 401);

    if (passwordResult.needsRehash) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: await hashPassword(password) },
      });
    }

    const safeUser = sanitizeUser(user);
    const response = NextResponse.json({
      success: true,
      message: 'Dang nhap thanh cong.',
      data: safeUser,
    });

    response.cookies.set(
      SESSION_COOKIE_NAME,
      createSessionToken(safeUser),
      getSessionCookieOptions()
    );

    return response;
  } catch (error) {
    return serverError('[POST /api/auth/login]', error);
  }
}
