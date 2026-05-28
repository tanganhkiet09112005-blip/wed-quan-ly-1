const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("Starting DB migration script...");

  // Add columns but make them nullable first
  await prisma.$executeRawUnsafe(`ALTER TABLE \`invoice\` ADD COLUMN \`cancelledAt\` DATETIME(3) NULL, ADD COLUMN \`customerAddress\` TEXT NULL, ADD COLUMN \`customerName\` VARCHAR(191) NULL, ADD COLUMN \`customerPhone\` VARCHAR(191) NULL, ADD COLUMN \`customerTaxCode\` VARCHAR(191) NULL, ADD COLUMN \`discount\` DOUBLE NOT NULL DEFAULT 0, ADD COLUMN \`paymentMethod\` VARCHAR(191) NULL, ADD COLUMN \`provider\` VARCHAR(191) NULL, ADD COLUMN \`providerInvoiceId\` VARCHAR(191) NULL, ADD COLUMN \`rawPayload\` TEXT NULL, ADD COLUMN \`shopId\` VARCHAR(191) NULL, ADD COLUMN \`subtotal\` DOUBLE NOT NULL DEFAULT 0, ADD COLUMN \`type\` VARCHAR(191) NOT NULL DEFAULT 'sale'`);

  // Data migration (backfill)
  // map amount to subtotal
  await prisma.$executeRawUnsafe(`UPDATE \`Invoice\` SET \`subtotal\` = \`amount\``);
  // map shopId and customerName from Order
  await prisma.$executeRawUnsafe(`UPDATE \`Invoice\` i JOIN \`Order\` o ON i.orderId = o.id SET i.shopId = o.shopId, i.customerName = COALESCE(o.shippingName, 'Guest')`);

  // Since shopId and customerName cannot be null in Prisma, we must ensure no nulls
  // Wait, if an invoice has no order or order is deleted, shopId might still be null. Let's provide a fallback just in case.
  await prisma.$executeRawUnsafe(`UPDATE \`Invoice\` SET \`shopId\` = 'unknown', \`customerName\` = 'Unknown' WHERE \`shopId\` IS NULL`);

  // Now make them required
  await prisma.$executeRawUnsafe(`ALTER TABLE \`invoice\` MODIFY \`customerName\` VARCHAR(191) NOT NULL, MODIFY \`shopId\` VARCHAR(191) NOT NULL`);

  // Drop old constraints
  await prisma.$executeRawUnsafe(`ALTER TABLE \`invoice\` DROP FOREIGN KEY \`Invoice_orderId_fkey\``);
  await prisma.$executeRawUnsafe(`DROP INDEX \`Invoice_code_key\` ON \`invoice\``);

  // Alter other columns and drop amount
  await prisma.$executeRawUnsafe(`ALTER TABLE \`invoice\` DROP COLUMN \`amount\`, DROP COLUMN \`misaSynced\`, MODIFY \`tax\` DOUBLE NOT NULL DEFAULT 0, MODIFY \`total\` DOUBLE NOT NULL DEFAULT 0, MODIFY \`status\` VARCHAR(191) NOT NULL DEFAULT 'draft', MODIFY \`issuedAt\` DATETIME(3) NULL, MODIFY \`orderId\` VARCHAR(191) NULL`);

  // Create table InvoiceItem
  await prisma.$executeRawUnsafe(`CREATE TABLE \`InvoiceItem\` (\`id\` VARCHAR(191) NOT NULL, \`shopId\` VARCHAR(191) NULL, \`invoiceId\` VARCHAR(191) NOT NULL, \`productId\` VARCHAR(191) NULL, \`variantId\` VARCHAR(191) NULL, \`sku\` VARCHAR(191) NULL, \`name\` VARCHAR(191) NOT NULL, \`quantity\` INTEGER NOT NULL, \`unitPrice\` DOUBLE NOT NULL, \`taxRate\` DOUBLE NOT NULL DEFAULT 0, \`lineTotal\` DOUBLE NOT NULL, \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), INDEX \`InvoiceItem_invoiceId_idx\`(\`invoiceId\`), INDEX \`InvoiceItem_shopId_idx\`(\`shopId\`), PRIMARY KEY (\`id\`)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

  // Indexes
  await prisma.$executeRawUnsafe(`CREATE INDEX \`Invoice_shopId_status_idx\` ON \`Invoice\`(\`shopId\`, \`status\`)`);
  await prisma.$executeRawUnsafe(`CREATE INDEX \`Invoice_orderId_idx\` ON \`Invoice\`(\`orderId\`)`);
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX \`Invoice_shopId_code_key\` ON \`Invoice\`(\`shopId\`, \`code\`)`);

  // FK
  await prisma.$executeRawUnsafe(`ALTER TABLE \`Invoice\` ADD CONSTRAINT \`Invoice_shopId_fkey\` FOREIGN KEY (\`shopId\`) REFERENCES \`Shop\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
  await prisma.$executeRawUnsafe(`ALTER TABLE \`Invoice\` ADD CONSTRAINT \`Invoice_orderId_fkey\` FOREIGN KEY (\`orderId\`) REFERENCES \`Order\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE`);
  await prisma.$executeRawUnsafe(`ALTER TABLE \`InvoiceItem\` ADD CONSTRAINT \`InvoiceItem_invoiceId_fkey\` FOREIGN KEY (\`invoiceId\`) REFERENCES \`Invoice\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);

  console.log("Migration script successful!");
}

run().catch(e => { console.error("Migration failed:", e); process.exit(1); }).finally(() => prisma.$disconnect());
