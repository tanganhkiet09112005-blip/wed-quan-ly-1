-- CreateTable
CREATE TABLE `EcommerceChannelConnection` (
    `id` VARCHAR(191) NOT NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL,
    `mode` VARCHAR(191) NOT NULL DEFAULT 'mock',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `externalShopId` VARCHAR(191) NOT NULL,
    `accessToken` TEXT NULL,
    `refreshToken` TEXT NULL,
    `lastSyncAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EcommerceChannelConnection_shopId_idx`(`shopId`),
    UNIQUE INDEX `EcommerceChannelConnection_shopId_platform_externalShopId_key`(`shopId`, `platform`, `externalShopId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EcommerceChannelConnection` ADD CONSTRAINT `EcommerceChannelConnection_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
