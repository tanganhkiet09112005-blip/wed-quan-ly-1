import crypto from 'crypto';
import { jsonError } from '@/lib/server/responses';

export function verifyOptionalWebhookSecret(request) {
  const expected = process.env.WEBHOOK_SECRET;
  if (!expected) return null;

  const url = new URL(request.url);
  const actual = request.headers.get('x-webhook-secret') || url.searchParams.get('secret') || '';
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);

  if (actualBuffer.length !== expectedBuffer.length) {
    return jsonError('Webhook secret khong hop le.', 401);
  }

  if (!crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
    return jsonError('Webhook secret khong hop le.', 401);
  }

  return null;
}
