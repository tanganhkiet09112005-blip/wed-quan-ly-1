-- Migration: add_admin_hierarchy_pricing
-- Created: 2026-05-29
-- Purpose: Add admin hierarchy, shop ownership, order weight tracking, and per-shop shipping rate plans
-- SAFE: Only ADD COLUMN / ADD TABLE, no DROP or ALTER existing columns

-- ── User: Add admin hierarchy fields ──────────────────────────────
ALTER TABLE `User`
  ADD COLUMN IF NOT EXISTS `parentAdminId` VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS `status` VARCHAR(191) NOT NULL DEFAULT 'active';

-- ── User: Add self-referential foreign key for admin hierarchy ─────
-- Only run if foreign key does not already exist
ALTER TABLE `User`
  ADD CONSTRAINT `User_parentAdminId_fkey`
  FOREIGN KEY (`parentAdminId`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Shop: Add adminId for ownership tracking ───────────────────────
ALTER TABLE `Shop`
  ADD COLUMN IF NOT EXISTS `adminId` VARCHAR(191) NULL;

ALTER TABLE `Shop`
  ADD CONSTRAINT `Shop_adminId_fkey`
  FOREIGN KEY (`adminId`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Order: Add weight and applied rate tier tracking ───────────────
ALTER TABLE `Order`
  ADD COLUMN IF NOT EXISTS `weight` DOUBLE NULL,
  ADD COLUMN IF NOT EXISTS `appliedRateTierId` VARCHAR(191) NULL;

-- ── New table: ShopShippingRate ────────────────────────────────────
CREATE TABLE IF NOT EXISTS `ShopShippingRate` (
  `id`              VARCHAR(191) NOT NULL,
  `shopId`          VARCHAR(191) NOT NULL,
  `name`            VARCHAR(191) NOT NULL DEFAULT 'Bảng giá mặc định',
  `isActive`        BOOLEAN NOT NULL DEFAULT true,
  `createdByAdminId` VARCHAR(191) NULL,
  `createdAt`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`       DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `ShopShippingRate_shopId_isActive_idx` (`shopId`, `isActive`),
  CONSTRAINT `ShopShippingRate_shopId_fkey`
    FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ShopShippingRate_createdByAdminId_fkey`
    FOREIGN KEY (`createdByAdminId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── New table: ShopShippingRateTier ───────────────────────────────
CREATE TABLE IF NOT EXISTS `ShopShippingRateTier` (
  `id`          VARCHAR(191) NOT NULL,
  `rateId`      VARCHAR(191) NOT NULL,
  `minWeight`   DOUBLE NOT NULL,
  `maxWeight`   DOUBLE NOT NULL,
  `price`       DOUBLE NOT NULL,
  `note`        VARCHAR(191) NULL,
  `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `ShopShippingRateTier_rateId_idx` (`rateId`),
  INDEX `ShopShippingRateTier_rateId_minWeight_idx` (`rateId`, `minWeight`),
  CONSTRAINT `ShopShippingRateTier_rateId_fkey`
    FOREIGN KEY (`rateId`) REFERENCES `ShopShippingRate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
