/**
 * seed-production-admin.js
 * 
 * Production-safe admin seed script.
 * - Only creates the platform super admin account.
 * - Does NOT reset or clean any existing data.
 * - Does NOT create demo shops, orders, products, or customers.
 * - Reads credentials from env vars (ADMIN_EMAIL, ADMIN_PASSWORD).
 * - Safe to run multiple times — idempotent via upsert.
 * 
 * Usage (with Railway DATABASE_URL set):
 *   set DATABASE_URL=mysql://...
 *   node prisma/seed-production-admin.js
 */

require('dotenv').config();
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt}$${key.toString('hex')}`;
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hship.vn';
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    if (IS_PRODUCTION) {
      console.error('[seed-production-admin] ERROR: ADMIN_PASSWORD env var is required in production.');
      process.exit(1);
    }
    console.warn('[seed-production-admin] ADMIN_PASSWORD not set, using default "admin123" (development only).');
  }

  const password = adminPassword || 'admin123';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existing) {
    console.log(`[seed-production-admin] Admin "${adminEmail}" already exists (id: ${existing.id}). Skipping creation.`);
    console.log('[seed-production-admin] Done. No changes made.');
    return;
  }

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'Admin Hship',
      password: hashPassword(password),
      role: 'admin',
    },
  });

  console.log(`[seed-production-admin] Created admin user: ${admin.email} (id: ${admin.id})`);
  console.log('[seed-production-admin] Done.');

  if (!IS_PRODUCTION) {
    console.log(`[seed-production-admin] Login: ${adminEmail} / ${password}`);
  }
}

main()
  .catch((error) => {
    console.error('[seed-production-admin] Fatal error:', error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
