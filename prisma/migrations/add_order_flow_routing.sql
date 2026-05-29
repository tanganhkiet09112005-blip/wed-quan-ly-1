-- AlterTable
ALTER TABLE `Shop` ADD COLUMN `autoPushCarrierEnabled` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Order` 
ADD COLUMN `flowStatus` VARCHAR(191) NULL,
ADD COLUMN `flowMessage` TEXT NULL,
ADD COLUMN `flowRuleId` VARCHAR(191) NULL,
ADD COLUMN `carrierCode` VARCHAR(191) NULL,
ADD COLUMN `carrierStatus` VARCHAR(191) NULL,
ADD COLUMN `pushedAt` DATETIME(3) NULL,
ADD COLUMN `pushError` TEXT NULL;

-- CreateTable
CREATE TABLE `OrderFlowRule` (
    `id` VARCHAR(191) NOT NULL,
    `shopId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `conditionType` VARCHAR(191) NOT NULL,
    `conditionValue` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `carrierCode` VARCHAR(191) NULL,
    `requireApproval` BOOLEAN NOT NULL DEFAULT false,
    `createdByAdminId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `OrderFlowRule_shopId_isActive_priority_idx`(`shopId`, `isActive`, `priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderFlowLog` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `fromStatus` VARCHAR(191) NULL,
    `toStatus` VARCHAR(191) NOT NULL,
    `message` TEXT NULL,
    `actorUserId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OrderFlowLog_orderId_createdAt_idx`(`orderId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OrderFlowRule` ADD CONSTRAINT `OrderFlowRule_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderFlowLog` ADD CONSTRAINT `OrderFlowLog_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
