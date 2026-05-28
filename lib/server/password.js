import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password, storedPassword) {
  if (!storedPassword) {
    return { valid: false, needsRehash: false };
  }

  if (!storedPassword.startsWith('scrypt$')) {
    const valid = storedPassword === password;
    return { valid, needsRehash: valid };
  }

  const [, salt, hash] = storedPassword.split('$');
  if (!salt || !hash) {
    return { valid: false, needsRehash: false };
  }

  const derivedKey = await scryptAsync(password, salt, KEY_LENGTH);
  const expected = Buffer.from(hash, 'hex');

  if (expected.length !== derivedKey.length) {
    return { valid: false, needsRehash: false };
  }

  return {
    valid: crypto.timingSafeEqual(expected, derivedKey),
    needsRehash: false,
  };
}
