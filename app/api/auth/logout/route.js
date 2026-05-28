import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, getClearSessionCookieOptions } from '@/lib/server/session';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Dang xuat thanh cong.',
    data: null,
  });

  response.cookies.set(SESSION_COOKIE_NAME, '', getClearSessionCookieOptions());
  return response;
}
