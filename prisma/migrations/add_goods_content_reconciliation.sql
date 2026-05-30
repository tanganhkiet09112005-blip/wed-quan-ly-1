-- Add goodsContent, reconciliationStatus, and reconciledAt to Order table
-- Idempotent check for Railway MySQL

SET @dbname = DATABASE();
SET @tablename = 'Order';
SET @columnname = 'goodsContent';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  'ALTER TABLE `Order` ADD COLUMN `goodsContent` VARCHAR(500) NULL, ADD COLUMN `reconciliationStatus` VARCHAR(191) NULL DEFAULT \'PENDING\', ADD COLUMN `reconciledAt` DATETIME(3) NULL;'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
