-- AlterTable to add nullable columns first
ALTER TABLE `invoice` 
    ADD COLUMN `cancelledAt` DATETIME(3) NULL,
    ADD COLUMN `customerAddress` TEXT NULL,
    ADD COLUMN `customerName` VARCHAR(191) NULL,
    ADD COLUMN `customerPhone` VARCHAR(191) NULL,
    ADD COLUMN `customerTaxCode` VARCHAR(191) NULL,
    ADD COLUMN `discount` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `paymentMethod` VARCHAR(191) NULL,
    ADD COLUMN `provider` VARCHAR(191) NULL,
    ADD COLUMN `providerInvoiceId` VARCHAR(191) NULL,
    ADD COLUMN `rawPayload` TEXT NULL,
    ADD COLUMN `shopId` VARCHAR(191) NULL,
    ADD COLUMN `subtotal` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'sale';

-- Backfill data
UPDATE `Invoice` SET `subtotal` = `amount`;
UPDATE `Invoice` i JOIN `Order` o ON i.orderId = o.id SET i.shopId = o.shopId, i.customerName = COALESCE(o.shippingName, 'Guest');
UPDATE `Invoice` SET `shopId` = 'unknown', `customerName` = 'Unknown' WHERE `shopId` IS NULL;

-- Now make them required
ALTER TABLE `invoice` 
    MODIFY `customerName` VARCHAR(191) NOT NULL,
    MODIFY `shopId` VARCHAR(191) NOT NULL;

-- DropForeignKey
ALTER TABLE `invoice` DROP FOREIGN KEY `Invoice_orderId_fkey`;

-- DropIndex
DROP INDEX `Invoice_code_key` ON `invoice`;

-- Drop old columns and apply remaining changes
ALTER TABLE `invoice` 
    DROP COLUMN `amount`,
    DROP COLUMN `misaSynced`,
    MODIFY `tax` DOUBLE NOT NULL DEFAULT 0,
    MODIFY `total` DOUBLE NOT NULL DEFAULT 0,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    MODIFY `issuedAt` DATETIME(3) NULL,
    MODIFY `orderId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `InvoiceItem` (
    `id` VARCHAR(191) NOT NULL,
    `shopId` VARCHAR(191) NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NULL,
    `variantId` VARCHAR(191) NULL,
    `sku` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unitPrice` DOUBLE NOT NULL,
    `taxRate` DOUBLE NOT NULL DEFAULT 0,
    `lineTotal` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InvoiceItem_invoiceId_idx`(`invoiceId`),
    INDEX `InvoiceItem_shopId_idx`(`shopId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Invoice_shopId_status_idx` ON `Invoice`(`shopId`, `status`);

-- CreateIndex
CREATE INDEX `Invoice_orderId_idx` ON `Invoice`(`orderId`);

-- CreateIndex
CREATE UNIQUE INDEX `Invoice_shopId_code_key` ON `Invoice`(`shopId`, `code`);

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvoiceItem` ADD CONSTRAINT `InvoiceItem_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
