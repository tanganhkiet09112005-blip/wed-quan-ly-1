ALTER TABLE `Order`
  ADD COLUMN `carrierFee` DOUBLE NOT NULL DEFAULT 0,
  ADD COLUMN `codCollectedAt` DATETIME(3) NULL,
  ADD COLUMN `carrierName` VARCHAR(191) NULL;

CREATE INDEX `Order_shopId_status_idx` ON `Order`(`shopId`, `status`);
CREATE INDEX `Order_shopId_codStatus_idx` ON `Order`(`shopId`, `codStatus`);
CREATE INDEX `Order_shopId_shipperCode_idx` ON `Order`(`shopId`, `shipperCode`);
