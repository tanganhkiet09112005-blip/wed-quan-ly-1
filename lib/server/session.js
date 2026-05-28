import crypto from 'crypto';

export const SESSION_COOKIE_NAME = 'wen_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET || process.env.ENCRYPTION_KEY;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET is not configured');
  }
  return secret || 'dev-session-secret-change-me';
}

function sign(value) {
  return crypto
    .createHmac('sha256', getSessionSecret())
    .update(value)
    .digest('base64url');
}

export function createSessionToken(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    shopId: user.shopId || null,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;

  const [encodedPayload, signature] = token.split('.');
  const expectedSignature = sign(encodedPayload);
  const signatureBuffer = Buffer.from(signature || '');
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (!payload?.sub || !payload?.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getSessionCookieOptions(maxAge = SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
}

export function getClearSessionCookieOptions() {
  return getSessionCookieOptions(0);
}
