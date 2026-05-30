-- add_auto_invoice_fields.sql

SET @dbname = DATABASE();

-- 1. Add fields to Shop table
SET @shop_table = 'Shop';

-- autoIssueInvoiceEnabled
SET @columnname1 = 'autoIssueInvoiceEnabled';
SET @preparedStatement1 = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @shop_table)
      AND (table_schema = @dbname)
      AND (column_name = @columnname1)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @shop_table, " ADD COLUMN ", @columnname1, " BOOLEAN NOT NULL DEFAULT false;")
));
PREPARE addColumn1 FROM @preparedStatement1;
EXECUTE addColumn1;
DEALLOCATE PREPARE addColumn1;

-- invoiceProvider
SET @columnname2 = 'invoiceProvider';
SET @preparedStatement2 = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @shop_table)
      AND (table_schema = @dbname)
      AND (column_name = @columnname2)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @shop_table, " ADD COLUMN ", @columnname2, " VARCHAR(191) NULL;")
));
PREPARE addColumn2 FROM @preparedStatement2;
EXECUTE addColumn2;
DEALLOCATE PREPARE addColumn2;

-- invoiceMode
SET @columnname3 = 'invoiceMode';
SET @preparedStatement3 = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @shop_table)
      AND (table_schema = @dbname)
      AND (column_name = @columnname3)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @shop_table, " ADD COLUMN ", @columnname3, " VARCHAR(191) NOT NULL DEFAULT 'MOCK';")
));
PREPARE addColumn3 FROM @preparedStatement3;
EXECUTE addColumn3;
DEALLOCATE PREPARE addColumn3;


-- 2. Add fields to Order table
SET @order_table = 'Order';

-- invoiceStatus
SET @col1 = 'invoiceStatus';
SET @prep1 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @order_table) AND (table_schema = @dbname) AND (column_name = @col1)) > 0,
  "SELECT 1", CONCAT("ALTER TABLE `", @order_table, "` ADD COLUMN ", @col1, " VARCHAR(191) NOT NULL DEFAULT 'NOT_ISSUED';")
));
PREPARE do_prep1 FROM @prep1; EXECUTE do_prep1; DEALLOCATE PREPARE do_prep1;

-- invoiceId
SET @col2 = 'invoiceId';
SET @prep2 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @order_table) AND (table_schema = @dbname) AND (column_name = @col2)) > 0,
  "SELECT 1", CONCAT("ALTER TABLE `", @order_table, "` ADD COLUMN ", @col2, " VARCHAR(191) NULL;")
));
PREPARE do_prep2 FROM @prep2; EXECUTE do_prep2; DEALLOCATE PREPARE do_prep2;

-- invoiceNumber
SET @col3 = 'invoiceNumber';
SET @prep3 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @order_table) AND (table_schema = @dbname) AND (column_name = @col3)) > 0,
  "SELECT 1", CONCAT("ALTER TABLE `", @order_table, "` ADD COLUMN ", @col3, " VARCHAR(191) NULL;")
));
PREPARE do_prep3 FROM @prep3; EXECUTE do_prep3; DEALLOCATE PREPARE do_prep3;

-- invoiceIssuedAt
SET @col4 = 'invoiceIssuedAt';
SET @prep4 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @order_table) AND (table_schema = @dbname) AND (column_name = @col4)) > 0,
  "SELECT 1", CONCAT("ALTER TABLE `", @order_table, "` ADD COLUMN ", @col4, " DATETIME(3) NULL;")
));
PREPARE do_prep4 FROM @prep4; EXECUTE do_prep4; DEALLOCATE PREPARE do_prep4;

-- invoiceProvider
SET @col5 = 'invoiceProvider';
SET @prep5 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @order_table) AND (table_schema = @dbname) AND (column_name = @col5)) > 0,
  "SELECT 1", CONCAT("ALTER TABLE `", @order_table, "` ADD COLUMN ", @col5, " VARCHAR(191) NULL;")
));
PREPARE do_prep5 FROM @prep5; EXECUTE do_prep5; DEALLOCATE PREPARE do_prep5;

-- invoiceError
SET @col6 = 'invoiceError';
SET @prep6 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @order_table) AND (table_schema = @dbname) AND (column_name = @col6)) > 0,
  "SELECT 1", CONCAT("ALTER TABLE `", @order_table, "` ADD COLUMN ", @col6, " TEXT NULL;")
));
PREPARE do_prep6 FROM @prep6; EXECUTE do_prep6; DEALLOCATE PREPARE do_prep6;

-- invoiceAutoIssued
SET @col7 = 'invoiceAutoIssued';
SET @prep7 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @order_table) AND (table_schema = @dbname) AND (column_name = @col7)) > 0,
  "SELECT 1", CONCAT("ALTER TABLE `", @order_table, "` ADD COLUMN ", @col7, " BOOLEAN NOT NULL DEFAULT false;")
));
PREPARE do_prep7 FROM @prep7; EXECUTE do_prep7; DEALLOCATE PREPARE do_prep7;

