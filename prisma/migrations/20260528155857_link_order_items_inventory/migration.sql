-- AlterTable
ALTER TABLE `inventorymovement` ADD COLUMN `orderId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `order` ADD COLUMN `stockDeductedAt` DATETIME(3) NULL,
    ADD COLUMN `stockRestoredAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `orderitem` ADD COLUMN `color` VARCHAR(191) NULL,
    ADD COLUMN `lineTotal` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `productCode` VARCHAR(191) NULL,
    ADD COLUMN `productId` VARCHAR(191) NULL,
    ADD COLUMN `productName` VARCHAR(191) NULL,
    ADD COLUMN `size` VARCHAR(191) NULL,
    ADD COLUMN `sku` VARCHAR(191) NULL,
    ADD COLUMN `unitPrice` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `variantId` VARCHAR(191) NULL,
    ADD COLUMN `variantName` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `InventoryMovement_orderId_idx` ON `InventoryMovement`(`orderId`);

-- CreateIndex
CREATE INDEX `Order_stockDeductedAt_idx` ON `Order`(`stockDeductedAt`);

-- CreateIndex
CREATE INDEX `OrderItem_productId_idx` ON `OrderItem`(`productId`);

-- CreateIndex
CREATE INDEX `OrderItem_variantId_idx` ON `OrderItem`(`variantId`);

-- CreateIndex
CREATE INDEX `OrderItem_sku_idx` ON `OrderItem`(`sku`);

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InventoryMovement` ADD CONSTRAINT `InventoryMovement_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
