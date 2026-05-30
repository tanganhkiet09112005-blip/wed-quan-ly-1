-- Migration: fix_missing_admin_pricing_after_partial_migration
-- Created: 2026-05-30
-- Purpose: Safely resume adding admin hierarchy & pricing columns after partial failure.
-- SAFE: Uses Stored Procedures to check INFORMATION_SCHEMA, entirely idempotent.

DROP PROCEDURE IF EXISTS AddColumnIfNotExists;
CREATE PROCEDURE AddColumnIfNotExists(
    IN dbName VARCHAR(255),
    IN tableName VARCHAR(255),
    IN columnName VARCHAR(255),
    IN columnDefinition TEXT
)
BEGIN
    DECLARE colCount INT;
    SELECT COUNT(*) INTO colCount
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = dbName
      AND TABLE_NAME = tableName
      AND COLUMN_NAME = columnName;
      
    IF colCount = 0 THEN
        SET @sql = CONCAT('ALTER TABLE `', tableName, '` ADD COLUMN `', columnName, '` ', columnDefinition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END;

DROP PROCEDURE IF EXISTS AddConstraintIfNotExists;
CREATE PROCEDURE AddConstraintIfNotExists(
    IN dbName VARCHAR(255),
    IN tableName VARCHAR(255),
    IN constraintName VARCHAR(255),
    IN constraintDefinition TEXT
)
BEGIN
    DECLARE count INT;
    SELECT COUNT(*) INTO count
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = dbName
      AND TABLE_NAME = tableName
      AND CONSTRAINT_NAME = constraintName;
      
    IF count = 0 THEN
        SET @sql = CONCAT('ALTER TABLE `', tableName, '` ADD CONSTRAINT `', constraintName, '` ', constraintDefinition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END;

-- ── 1. Fix User Table ─────────────────────────────────────────────
CALL AddColumnIfNotExists(DATABASE(), 'User', 'parentAdminId', 'VARCHAR(191) NULL');
CALL AddColumnIfNotExists(DATABASE(), 'User', 'status', 'VARCHAR(191) NOT NULL DEFAULT ''active''');
CALL AddConstraintIfNotExists(DATABASE(), 'User', 'User_parentAdminId_fkey', 'FOREIGN KEY (`parentAdminId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE');

-- ── 2. Fix Shop Table ─────────────────────────────────────────────
CALL AddColumnIfNotExists(DATABASE(), 'Shop', 'adminId', 'VARCHAR(191) NULL');
-- Ignore autoPushCarrierEnabled since it already exists, but check it just in case
CALL AddColumnIfNotExists(DATABASE(), 'Shop', 'autoPushCarrierEnabled', 'BOOLEAN NOT NULL DEFAULT false');
CALL AddConstraintIfNotExists(DATABASE(), 'Shop', 'Shop_adminId_fkey', 'FOREIGN KEY (`adminId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE');

-- ── 3. Fix Order Table ────────────────────────────────────────────
CALL AddColumnIfNotExists(DATABASE(), 'Order', 'weight', 'DOUBLE NULL');
CALL AddColumnIfNotExists(DATABASE(), 'Order', 'appliedRateTierId', 'VARCHAR(191) NULL');

-- ── 4. Create Tables ShopShippingRate ─────────────────────────────
CREATE TABLE IF NOT EXISTS `ShopShippingRate` (
  `id`              VARCHAR(191) NOT NULL,
  `shopId`          VARCHAR(191) NOT NULL,
  `name`            VARCHAR(191) NOT NULL DEFAULT 'Bảng giá mặc định',
  `isActive`        BOOLEAN NOT NULL DEFAULT true,
  `createdByAdminId` VARCHAR(191) NULL,
  `createdAt`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`       DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `ShopShippingRate_shopId_isActive_idx` (`shopId`, `isActive`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CALL AddConstraintIfNotExists(DATABASE(), 'ShopShippingRate', 'ShopShippingRate_shopId_fkey', 'FOREIGN KEY (`shopId`) REFERENCES `Shop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE');
CALL AddConstraintIfNotExists(DATABASE(), 'ShopShippingRate', 'ShopShippingRate_createdByAdminId_fkey', 'FOREIGN KEY (`createdByAdminId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE');

-- ── 5. Create Tables ShopShippingRateTier ─────────────────────────
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
  INDEX `ShopShippingRateTier_rateId_minWeight_idx` (`rateId`, `minWeight`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CALL AddConstraintIfNotExists(DATABASE(), 'ShopShippingRateTier', 'ShopShippingRateTier_rateId_fkey', 'FOREIGN KEY (`rateId`) REFERENCES `ShopShippingRate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE');

-- ── 6. Cleanup Procedures ─────────────────────────────────────────
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;
DROP PROCEDURE IF EXISTS AddConstraintIfNotExists;
