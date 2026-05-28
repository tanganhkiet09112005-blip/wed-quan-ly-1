CREATE TABLE `ChatSession` (
    `id` VARCHAR(191) NOT NULL,
    `channel` VARCHAR(191) NOT NULL,
    `customerName` VARCHAR(191) NULL,
    `customerPhone` VARCHAR(191) NULL,
    `shippingAddress` TEXT NULL,
    `productName` VARCHAR(191) NULL,
    `size` VARCHAR(191) NULL,
    `quantity` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'collecting',
    `missingFields` TEXT NULL,
    `rawComment` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `shopId` VARCHAR(191) NULL,
    `draftOrderId` VARCHAR(191) NULL,

    UNIQUE INDEX `ChatSession_draftOrderId_key`(`draftOrderId`),
    INDEX `ChatSession_shopId_channel_idx`(`shopId`, `channel`),
    INDEX `ChatSession_shopId_status_idx`(`shopId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ChatMessage` (
    `id` VARCHAR(191) NOT NULL,
    `sender` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `parsedData` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sessionId` VARCHAR(191) NOT NULL,

    INDEX `ChatMessage_sessionId_createdAt_idx`(`sessionId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ChatSession` ADD CONSTRAINT `ChatSession_shopId_fkey` FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ChatSession` ADD CONSTRAINT `ChatSession_draftOrderId_fkey` FOREIGN KEY (`draftOrderId`) REFERENCES `Order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `ChatSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
