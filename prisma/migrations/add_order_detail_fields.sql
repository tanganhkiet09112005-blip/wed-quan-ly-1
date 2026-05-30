-- Create stored procedure for idempotent column addition
DROP PROCEDURE IF EXISTS add_order_columns_if_not_exists;

DELIMITER $$
CREATE PROCEDURE add_order_columns_if_not_exists()
BEGIN
  -- Add senderName
  IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Order'
      AND COLUMN_NAME = 'senderName'
  ) THEN
    ALTER TABLE `Order` ADD COLUMN `senderName` VARCHAR(191) NULL;
  END IF;

  -- Add senderPhone
  IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Order'
      AND COLUMN_NAME = 'senderPhone'
  ) THEN
    ALTER TABLE `Order` ADD COLUMN `senderPhone` VARCHAR(191) NULL;
  END IF;

  -- Add senderAddress
  IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Order'
      AND COLUMN_NAME = 'senderAddress'
  ) THEN
    ALTER TABLE `Order` ADD COLUMN `senderAddress` TEXT NULL;
  END IF;

  -- Add receiverProvince
  IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Order'
      AND COLUMN_NAME = 'receiverProvince'
  ) THEN
    ALTER TABLE `Order` ADD COLUMN `receiverProvince` VARCHAR(191) NULL;
  END IF;

  -- Add receiverDistrict
  IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Order'
      AND COLUMN_NAME = 'receiverDistrict'
  ) THEN
    ALTER TABLE `Order` ADD COLUMN `receiverDistrict` VARCHAR(191) NULL;
  END IF;

  -- Add receiverWard
  IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Order'
      AND COLUMN_NAME = 'receiverWard'
  ) THEN
    ALTER TABLE `Order` ADD COLUMN `receiverWard` VARCHAR(191) NULL;
  END IF;

END $$
DELIMITER ;

-- Execute the procedure
CALL add_order_columns_if_not_exists();

-- Drop the procedure
DROP PROCEDURE IF EXISTS add_order_columns_if_not_exists;
