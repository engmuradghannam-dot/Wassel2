-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "alternativeAccountNumber" TEXT,
ADD COLUMN     "blockedForPosting" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isReconciliationAccount" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lineItemDisplay" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "openItemManagement" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reconciliationAccountType" TEXT,
ADD COLUMN     "taxCategory" TEXT;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "additionalNumber" TEXT,
ADD COLUMN     "buildingNumber" TEXT,
ADD COLUMN     "completeDeliveryRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "crExpiryDate" TIMESTAMP(3),
ADD COLUMN     "customerClassification" TEXT,
ADD COLUMN     "defaultPriceListId" TEXT,
ADD COLUMN     "deliveryPriority" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "dunningBlock" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "incoterm" "Incoterm",
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "isBlacklisted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'ar',
ADD COLUMN     "legalForm" TEXT,
ADD COLUMN     "paymentBlock" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "poBox" TEXT,
ADD COLUMN     "reconciliationAccountId" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "riskCategory" TEXT,
ADD COLUMN     "salesPersonId" TEXT,
ADD COLUMN     "salesTerritory" TEXT,
ADD COLUMN     "searchTerm" TEXT,
ADD COLUMN     "shippingCondition" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "taxClassification" TEXT,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "vatRegistrationDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "batchManaged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "countryOfOrigin" TEXT DEFAULT 'SA',
ADD COLUMN     "deliveryTimeDays" INTEGER,
ADD COLUMN     "division" TEXT,
ADD COLUMN     "goodsReceiptBasedInvoiceVerification" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "grossWeight" DECIMAL(12,3),
ADD COLUMN     "height" DECIMAL(10,2),
ADD COLUMN     "hsCode" TEXT,
ADD COLUMN     "isHazardous" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "length" DECIMAL(10,2),
ADD COLUMN     "lotSizingProcedure" TEXT NOT NULL DEFAULT 'LOT_FOR_LOT',
ADD COLUMN     "manufacturerName" TEXT,
ADD COLUMN     "manufacturerPartNumber" TEXT,
ADD COLUMN     "minOrderQuantity" DECIMAL(18,4),
ADD COLUMN     "netWeight" DECIMAL(12,3),
ADD COLUMN     "oldItemCode" TEXT,
ADD COLUMN     "planningTimeFenceDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "preferredSupplierId" TEXT,
ADD COLUMN     "priceControl" TEXT NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "procurementType" TEXT NOT NULL DEFAULT 'BUY',
ADD COLUMN     "purchasingGroup" TEXT,
ADD COLUMN     "purchasingUnitOfMeasure" TEXT,
ADD COLUMN     "qualityInspectionRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "safetyStock" DECIMAL(18,2) NOT NULL DEFAULT 0,
ADD COLUMN     "salesUnitOfMeasure" TEXT,
ADD COLUMN     "serialManaged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shelfLifeDays" INTEGER,
ADD COLUMN     "storageConditions" TEXT,
ADD COLUMN     "taxClassification" TEXT DEFAULT 'STANDARD_RATED',
ADD COLUMN     "volume" DECIMAL(12,4),
ADD COLUMN     "volumeUnit" TEXT NOT NULL DEFAULT 'M3',
ADD COLUMN     "weightUnit" TEXT NOT NULL DEFAULT 'KG',
ADD COLUMN     "width" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "additionalNumber" TEXT,
ADD COLUMN     "buildingNumber" TEXT,
ADD COLUMN     "buyerId" TEXT,
ADD COLUMN     "crExpiryDate" TIMESTAMP(3),
ADD COLUMN     "defaultPriceListId" TEXT,
ADD COLUMN     "deliveryRating" DECIMAL(3,2),
ADD COLUMN     "district" TEXT,
ADD COLUMN     "incoterm" "Incoterm",
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "isApprovedVendor" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isBlacklisted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'ar',
ADD COLUMN     "leadTimeDays" INTEGER,
ADD COLUMN     "legalForm" TEXT,
ADD COLUMN     "minimumOrderValue" DECIMAL(18,2),
ADD COLUMN     "paymentBlock" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "poBox" TEXT,
ADD COLUMN     "priceRating" DECIMAL(3,2),
ADD COLUMN     "qualityRating" DECIMAL(3,2),
ADD COLUMN     "reconciliationAccountId" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "searchTerm" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "vatRegistrationDate" TIMESTAMP(3),
ADD COLUMN     "vendorClassification" TEXT,
ADD COLUMN     "withholdingTaxApplicable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "withholdingTaxRate" DECIMAL(5,2);

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_reconciliationAccountId_fkey" FOREIGN KEY ("reconciliationAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_salesPersonId_fkey" FOREIGN KEY ("salesPersonId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_defaultPriceListId_fkey" FOREIGN KEY ("defaultPriceListId") REFERENCES "price_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_reconciliationAccountId_fkey" FOREIGN KEY ("reconciliationAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_defaultPriceListId_fkey" FOREIGN KEY ("defaultPriceListId") REFERENCES "price_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_preferredSupplierId_fkey" FOREIGN KEY ("preferredSupplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
