-- ============================================================================
-- Tenant-scoped uniqueness + real company membership
-- ============================================================================
-- Context: document numbers (invoice/order/entry/etc.) and codes were unique
-- across the WHOLE database instead of per company, and there was no real
-- table recording which users belong to which companies (access was
-- effectively "whatever companyId the client happened to send"). This
-- migration fixes both. It is transactional — if any step fails (e.g. a
-- genuine duplicate number inside the same company), nothing is changed.
--
-- Before running this on real data, run:
--   npx tsx --require dotenv/config scripts/check-duplicates-before-migration.ts
-- and resolve anything it reports first.
-- ============================================================================

-- DropIndex
DROP INDEX "assets_assetNumber_key";

-- DropIndex
DROP INDEX "blog_posts_slug_key";

-- DropIndex
DROP INDEX "boms_bomNumber_key";

-- DropIndex
DROP INDEX "customers_code_key";

-- DropIndex
DROP INDEX "delivery_notes_deliveryNumber_key";

-- DropIndex
DROP INDEX "employees_employeeNumber_key";

-- DropIndex
DROP INDEX "invoices_invoiceNumber_key";

-- DropIndex
DROP INDEX "issues_issueNumber_key";

-- DropIndex
DROP INDEX "items_code_key";

-- DropIndex
DROP INDEX "journal_entries_entryNumber_key";

-- DropIndex
DROP INDEX "production_plans_planNumber_key";

-- DropIndex
DROP INDEX "projects_projectCode_key";

-- DropIndex
DROP INDEX "purchase_orders_orderNumber_key";

-- DropIndex
DROP INDEX "purchase_receipts_receiptNumber_key";

-- DropIndex
DROP INDEX "quality_inspections_qiNumber_key";

-- DropIndex
DROP INDEX "quotations_quotationNumber_key";

-- DropIndex
DROP INDEX "requests_for_quotation_rfqNumber_key";

-- DropIndex
DROP INDEX "sales_orders_orderNumber_key";

-- DropIndex
DROP INDEX "stock_entries_entryNumber_key";

-- DropIndex
DROP INDEX "stock_reconciliations_reconciliationNumber_key";

-- DropIndex
DROP INDEX "subcontracting_orders_orderNumber_key";

-- DropIndex
DROP INDEX "suppliers_code_key";

-- DropIndex
DROP INDEX "web_pages_route_key";

-- DropIndex
DROP INDEX "work_orders_workOrderNumber_key";

-- CreateTable
CREATE TABLE "company_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_members_userId_companyId_key" ON "company_members"("userId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "assets_companyId_assetNumber_key" ON "assets"("companyId", "assetNumber");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_companyId_slug_key" ON "blog_posts"("companyId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "boms_companyId_bomNumber_key" ON "boms"("companyId", "bomNumber");

-- CreateIndex
CREATE UNIQUE INDEX "customers_companyId_code_key" ON "customers"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_notes_companyId_deliveryNumber_key" ON "delivery_notes"("companyId", "deliveryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "employees_companyId_employeeNumber_key" ON "employees"("companyId", "employeeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_companyId_invoiceNumber_key" ON "invoices"("companyId", "invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "issues_companyId_issueNumber_key" ON "issues"("companyId", "issueNumber");

-- CreateIndex
CREATE UNIQUE INDEX "items_companyId_code_key" ON "items"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_companyId_entryNumber_key" ON "journal_entries"("companyId", "entryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "production_plans_companyId_planNumber_key" ON "production_plans"("companyId", "planNumber");

-- CreateIndex
CREATE UNIQUE INDEX "projects_companyId_projectCode_key" ON "projects"("companyId", "projectCode");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_companyId_orderNumber_key" ON "purchase_orders"("companyId", "orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_receipts_companyId_receiptNumber_key" ON "purchase_receipts"("companyId", "receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "quality_inspections_companyId_qiNumber_key" ON "quality_inspections"("companyId", "qiNumber");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_companyId_quotationNumber_key" ON "quotations"("companyId", "quotationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "requests_for_quotation_companyId_rfqNumber_key" ON "requests_for_quotation"("companyId", "rfqNumber");

-- CreateIndex
CREATE UNIQUE INDEX "sales_orders_companyId_orderNumber_key" ON "sales_orders"("companyId", "orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "stock_entries_companyId_entryNumber_key" ON "stock_entries"("companyId", "entryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "stock_reconciliations_companyId_reconciliationNumber_key" ON "stock_reconciliations"("companyId", "reconciliationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "subcontracting_orders_companyId_orderNumber_key" ON "subcontracting_orders"("companyId", "orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_companyId_code_key" ON "suppliers"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "web_pages_companyId_route_key" ON "web_pages"("companyId", "route");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_companyId_workOrderNumber_key" ON "work_orders"("companyId", "workOrderNumber");

-- AddForeignKey
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Backfill: give every company's creator ADMIN membership automatically,
-- so nobody who already "owns" a company gets locked out by the new
-- membership check.
INSERT INTO "company_members" ("id", "userId", "companyId", "role", "createdAt")
SELECT gen_random_uuid(), c."createdById", c."id", 'ADMIN', now()
FROM "companies" c
ON CONFLICT DO NOTHING;

-- Backfill: any Employee already linked to a login (userId IS NOT NULL)
-- also gets membership in that employee's company.
INSERT INTO "company_members" ("id", "userId", "companyId", "role", "createdAt")
SELECT gen_random_uuid(), e."userId", e."companyId", 'USER', now()
FROM "employees" e
WHERE e."userId" IS NOT NULL
ON CONFLICT ("userId", "companyId") DO NOTHING;
