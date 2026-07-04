// Run this BEFORE applying the "tenant_scoped_uniques_and_membership" migration
// on a database that already has real data in it.
//
// It checks every table whose "number/code" field is about to become
// unique-per-company (instead of unique-across-the-whole-database) and
// reports any (companyId, value) pair that appears more than once. If this
// script prints nothing, the migration is safe to apply. If it prints
// conflicts, fix or rename those specific rows first — the migration will
// otherwise fail cleanly (no partial changes) when it hits that constraint.
//
// Usage:
//   npx tsx --require dotenv/config scripts/check-duplicates-before-migration.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const checks: { table: string; field: string }[] = [
  { table: 'assets', field: 'assetNumber' },
  { table: 'blog_posts', field: 'slug' },
  { table: 'boms', field: 'bomNumber' },
  { table: 'customers', field: 'code' },
  { table: 'delivery_notes', field: 'deliveryNumber' },
  { table: 'employees', field: 'employeeNumber' },
  { table: 'invoices', field: 'invoiceNumber' },
  { table: 'issues', field: 'issueNumber' },
  { table: 'items', field: 'code' },
  { table: 'journal_entries', field: 'entryNumber' },
  { table: 'production_plans', field: 'planNumber' },
  { table: 'projects', field: 'projectCode' },
  { table: 'purchase_orders', field: 'orderNumber' },
  { table: 'purchase_receipts', field: 'receiptNumber' },
  { table: 'quality_inspections', field: 'qiNumber' },
  { table: 'quotations', field: 'quotationNumber' },
  { table: 'requests_for_quotation', field: 'rfqNumber' },
  { table: 'sales_orders', field: 'orderNumber' },
  { table: 'stock_entries', field: 'entryNumber' },
  { table: 'stock_reconciliations', field: 'reconciliationNumber' },
  { table: 'subcontracting_orders', field: 'orderNumber' },
  { table: 'suppliers', field: 'code' },
  { table: 'web_pages', field: 'route' },
  { table: 'work_orders', field: 'workOrderNumber' },
];

async function main() {
  let foundAny = false;

  for (const { table, field } of checks) {
    const rows = await prisma.$queryRawUnsafe<{ companyId: string; value: string; count: bigint }[]>(
      `SELECT "companyId", "${field}" AS value, COUNT(*) AS count
       FROM "${table}"
       GROUP BY "companyId", "${field}"
       HAVING COUNT(*) > 1`
    );

    if (rows.length > 0) {
      foundAny = true;
      console.log(`\n⚠️  ${table}.${field} has ${rows.length} duplicate (company, value) pair(s):`);
      for (const row of rows) {
        console.log(`   companyId=${row.companyId}  ${field}="${row.value}"  count=${row.count}`);
      }
    }
  }

  if (!foundAny) {
    console.log('✅ No conflicts found — the migration is safe to apply.');
  } else {
    console.log('\n❌ Fix or rename the rows listed above (e.g. append -2, -3 to the duplicate values)');
    console.log('   before running: npx prisma migrate deploy');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
