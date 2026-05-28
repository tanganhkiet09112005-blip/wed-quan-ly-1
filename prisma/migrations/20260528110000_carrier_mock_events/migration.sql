CREATE TABLE `CarrierEvent` (
    `id` VARCHAR(191) NOT NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `carrierCode` VARCHAR(191) NOT NULL,
    `trackingCode` VARCHAR(191) NOT NULL,
    `eventStatus` VARCHAR(191) NOT NULL,
    `mappedOrderStatus` VARCHAR(191) NOT NULL,
    `rawPayload` TEXT NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CarrierEvent_shopId_carrierCode_idx`(`shopId`, `carrierCode`),
    INDEX `CarrierEvent_shopId_createdAt_idx`(`shopId`, `createdAt`),
    INDEX `CarrierEvent_orderId_createdAt_idx`(`orderId`, `createdAt`),
    INDEX `CarrierEvent_trackingCode_idx`(`trackingCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `CarrierEvent` ADD CONSTRAINT `CarrierEvent_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `CarrierEvent` ADD CONSTRAINT `CarrierEvent_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
