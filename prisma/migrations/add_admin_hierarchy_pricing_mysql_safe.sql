-- Migration: add_admin_hierarchy_pricing_mysql_safe
-- Created: 2026-05-30
-- Purpose: Add admin hierarchy, shop ownership, order weight tracking, and per-shop shipping rate plans
-- SAFE: Compatible with Railway MySQL (removed IF NOT EXISTS for ADD COLUMN).
-- ASSUMPTION: This script assumes the columns do not already exist (which is true since the previous run failed on syntax error).

-- ── User: Add admin hierarchy fields ──────────────────────────────
ALTER TABLE `User`
  ADD COLUMN `parentAdminId` VARCHAR(191) NULL,
  ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'active';

-- ── User: Add self-referential foreign key for admin hierarchy ─────
ALTER TABLE `User`
  ADD CONSTRAINT `User_parentAdminId_fkey`
  FOREIGN KEY (`parentAdminId`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Shop: Add adminId for ownership tracking and auto push flag ────
ALTER TABLE `Shop`
  ADD COLUMN `adminId` VARCHAR(191) NULL,
  ADD COLUMN `autoPushCarrierEnabled` BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE `Shop`
  ADD CONSTRAINT `Shop_adminId_fkey`
  FOREIGN KEY (`adminId`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Order: Add weight and applied rate tier tracking ───────────────
ALTER TABLE `Order`
  ADD COLUMN `weight` DOUBLE NULL,
  ADD COLUMN `appliedRateTierId` VARCHAR(191) NULL;

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
