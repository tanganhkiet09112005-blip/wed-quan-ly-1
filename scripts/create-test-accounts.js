import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

const prisma = new PrismaClient();

async function main() {
  console.log('--- BẮT ĐẦU TẠO TEST ACCOUNTS ---');
  
  const testPassword = await hashPassword('Test@123456');

  // 1. TẠO SUPER ADMIN
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin.test@hship.local' },
    update: {
      password: testPassword,
      role: 'admin',
      parentAdminId: null,
      status: 'active'
    },
    create: {
      email: 'superadmin.test@hship.local',
      name: 'UAT Super Admin',
      password: testPassword,
      role: 'admin',
      parentAdminId: null,
      status: 'active'
    }
  });
  console.log('✅ Created Super Admin:', superAdmin.email);

  // 2. TẠO ADMIN CON (Thuộc Super Admin)
  const adminConA = await prisma.user.upsert({
    where: { email: 'admin.a.test@hship.local' },
    update: {
      password: testPassword,
      role: 'admin',
      parentAdminId: superAdmin.id,
      status: 'active'
    },
    create: {
      email: 'admin.a.test@hship.local',
      name: 'UAT Admin Con A',
      password: testPassword,
      role: 'admin',
      parentAdminId: superAdmin.id,
      status: 'active'
    }
  });
  console.log('✅ Created Admin Con A:', adminConA.email);

  // 3. TẠO SHOP A & SHOP B
  const shopA = await prisma.shop.upsert({
    where: { code: 'SHOP_A_TEST' },
    update: {
      name: 'UAT Shop A',
      ownerName: 'Chủ Shop A',
      email: 'shop.a.test@hship.local',
      phone: '0999999991',
      adminId: adminConA.id,
      status: 'active'
    },
    create: {
      code: 'SHOP_A_TEST',
      name: 'UAT Shop A',
      ownerName: 'Chủ Shop A',
      email: 'shop.a.test@hship.local',
      phone: '0999999991',
      adminId: adminConA.id,
      status: 'active'
    }
  });
  console.log('✅ Created Shop A:', shopA.code);

  const shopB = await prisma.shop.upsert({
    where: { code: 'SHOP_B_TEST' },
    update: {
      name: 'UAT Shop B',
      ownerName: 'Chủ Shop B',
      email: 'shop.b.test@hship.local',
      phone: '0999999992',
      adminId: superAdmin.id,
      status: 'active'
    },
    create: {
      code: 'SHOP_B_TEST',
      name: 'UAT Shop B',
      ownerName: 'Chủ Shop B',
      email: 'shop.b.test@hship.local',
      phone: '0999999992',
      adminId: superAdmin.id,
      status: 'active'
    }
  });
  console.log('✅ Created Shop B:', shopB.code);

  // 4. TẠO USER ĐĂNG NHẬP CHO SHOP A & B
  const shopUserA = await prisma.user.upsert({
    where: { email: 'shop.a.test@hship.local' },
    update: {
      password: testPassword,
      role: 'customer',
      shopId: shopA.id,
      status: 'active'
    },
    create: {
      email: 'shop.a.test@hship.local',
      name: 'UAT Chủ Shop A',
      password: testPassword,
      role: 'customer',
      shopId: shopA.id,
      status: 'active'
    }
  });
  console.log('✅ Created Shop User A:', shopUserA.email);

  const shopUserB = await prisma.user.upsert({
    where: { email: 'shop.b.test@hship.local' },
    update: {
      password: testPassword,
      role: 'customer',
      shopId: shopB.id,
      status: 'active'
    },
    create: {
      email: 'shop.b.test@hship.local',
      name: 'UAT Chủ Shop B',
      password: testPassword,
      role: 'customer',
      shopId: shopB.id,
      status: 'active'
    }
  });
  console.log('✅ Created Shop User B:', shopUserB.email);

  // 5. TẠO BẢNG GIÁ
  // Xóa bảng giá test cũ của 2 shop này để recreate sạch sẽ
  await prisma.shopShippingRate.deleteMany({
    where: { shopId: { in: [shopA.id, shopB.id] } }
  });

  // Bảng giá Shop A (Thuộc Admin Con A)
  await prisma.shopShippingRate.create({
    data: {
      shopId: shopA.id,
      name: 'Bảng giá UAT Shop A',
      isActive: true,
      createdByAdminId: adminConA.id,
      tiers: {
        create: [
          { minWeight: 0, maxWeight: 5, price: 22000, note: 'Mốc 1' },
          { minWeight: 5.01, maxWeight: 10, price: 30000, note: 'Mốc 2' }
        ]
      }
    }
  });
  console.log('✅ Created Pricing Shop A');

  // Bảng giá Shop B (Thuộc Super Admin)
  await prisma.shopShippingRate.create({
    data: {
      shopId: shopB.id,
      name: 'Bảng giá UAT Shop B',
      isActive: true,
      createdByAdminId: superAdmin.id,
      tiers: {
        create: [
          { minWeight: 0, maxWeight: 5, price: 30000, note: 'Mốc 1' },
          { minWeight: 5.01, maxWeight: 10, price: 45000, note: 'Mốc 2' }
        ]
      }
    }
  });
  console.log('✅ Created Pricing Shop B');

  console.log('--- TẠO TÀI KHOẢN HOÀN TẤT ---');
  console.log('Lưu ý: Bạn có thể thay đổi/khoá các tài khoản này trên UI Admin sau khi test.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
