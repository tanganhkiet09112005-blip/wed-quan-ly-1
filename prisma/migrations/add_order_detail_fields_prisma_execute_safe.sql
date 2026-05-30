-- add_order_detail_fields_prisma_execute_safe.sql

SET @dbname = DATABASE();
SET @order_table = 'Order';

-- senderName
SET @col1 = 'senderName';
SET @prep1 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @order_table) AND (table_schema = @dbname) AND (column_name = @col1)) > 0,
  "SELECT 1", CONCAT("ALTER TABLE `", @order_table, "` ADD COLUMN ", @col1, " VARCHAR(191) NULL;")
));
PREPARE do_prep1 FROM @prep1; EXECUTE do_prep1; DEALLOCATE PREPARE do_prep1;

-- senderPhone
SET @col2 = 'senderPhone';
SET @prep2 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @order_table) AND (table_schema = @dbname) AND (column_name = @col2)) > 0,
  "SELECT 1", CONCAT("ALTER TABLE `", @order_table, "` ADD COLUMN ", @col2, " VARCHAR(191) NULL;")
));
PREPARE do_prep2 FROM @prep2; EXECUTE do_prep2; DEALLOCATE PREPARE do_prep2;

-- senderAddress
SET @col3 = 'senderAddress';
SET @prep3 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @order_table) AND (table_schema = @dbname) AND (column_name = @col3)) > 0,
  "SELECT 1", CONCAT("ALTER TABLE `", @order_table, "` ADD COLUMN ", @col3, " TEXT NULL;")
));
PREPARE do_prep3 FROM @prep3; EXECUTE do_prep3; DEALLOCATE PREPARE do_prep3;

-- receiverProvince
SET @col4 = 'receiverProvince';
SET @prep4 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @order_table) AND (table_schema = @dbname) AND (column_name = @col4)) > 0,
  "SELECT 1", CONCAT("ALTER TABLE `", @order_table, "` ADD COLUMN ", @col4, " VARCHAR(191) NULL;")
));
PREPARE do_prep4 FROM @prep4; EXECUTE do_prep4; DEALLOCATE PREPARE do_prep4;

-- receiverDistrict
SET @col5 = 'receiverDistrict';
SET @prep5 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @order_table) AND (table_schema = @dbname) AND (column_name = @col5)) > 0,
  "SELECT 1", CONCAT("ALTER TABLE `", @order_table, "` ADD COLUMN ", @col5, " VARCHAR(191) NULL;")
));
PREPARE do_prep5 FROM @prep5; EXECUTE do_prep5; DEALLOCATE PREPARE do_prep5;

-- receiverWard
SET @col6 = 'receiverWard';
SET @prep6 = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE (table_name = @order_table) AND (table_schema = @dbname) AND (column_name = @col6)) > 0,
  "SELECT 1", CONCAT("ALTER TABLE `", @order_table, "` ADD COLUMN ", @col6, " VARCHAR(191) NULL;")
));
PREPARE do_prep6 FROM @prep6; EXECUTE do_prep6; DEALLOCATE PREPARE do_prep6;
