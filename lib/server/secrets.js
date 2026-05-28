import crypto from 'crypto';

const PREFIX = 'enc:v1:';

function getEncryptionKey() {
  const rawKey = process.env.ENCRYPTION_KEY;
  if (!rawKey) {
    throw new Error('ENCRYPTION_KEY is not configured');
  }
  return crypto.createHash('sha256').update(rawKey).digest();
}

export function isEncryptedSecret(value) {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

export function encryptSecret(value) {
  if (value === null || value === undefined || value === '') return value || '';
  const text = String(value);
  if (isEncryptedSecret(text)) return text;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString('base64url')}:${tag.toString('base64url')}:${encrypted.toString('base64url')}`;
}

export function decryptSecret(value) {
  if (!value) return '';
  const text = String(value);
  if (!isEncryptedSecret(text)) return text;

  try {
    const [, payload] = text.split(PREFIX);
    const [ivRaw, tagRaw, encryptedRaw] = payload.split(':');
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      getEncryptionKey(),
      Buffer.from(ivRaw, 'base64url')
    );
    decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedRaw, 'base64url')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch {
    return '';
  }
}

export function maskSecret(value) {
  const plain = decryptSecret(value);
  if (!plain) return '';
  if (plain.length <= 4) return '****';
  return `****${plain.slice(-4)}`;
}

export function isMaskedSecret(value) {
  return typeof value === 'string' && value.startsWith('****');
}

export function prepareSecretForUpdate(value) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return '';
  if (isMaskedSecret(value)) return undefined;
  return encryptSecret(String(value).trim());
}
