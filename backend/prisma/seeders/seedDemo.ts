// MuradERP Demo Data Seeder
// Creates one linked, realistic sample per major module you haven't tried yet:
// a demo Item (finished good) + a raw material Item + a Warehouse + a BOM
// connecting them + a Project with one Task. Safe to re-run (skips anything
// that already exists by name/code).

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!admin) {
    console.log('No admin user found — run "npm run db:seed" first.');
    return;
  }

  const company = await prisma.company.findFirst({ where: { status: 'ACTIVE' } });
  if (!company) {
    console.log('No company found — create a company first (Companies page or db:seed).');
    return;
  }

  // Warehouse
  let warehouse = await prisma.warehouse.findFirst({ where: { companyId: company.id, name: 'المستودع الرئيسي' } });
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: { code: 'WH-MAIN', name: 'Main Warehouse', nameAr: 'المستودع الرئيسي', isDefault: true, companyId: company.id },
    });
    console.log('Created warehouse:', warehouse.name);
  }

  // Raw material item
  let rawItem = await prisma.item.findFirst({ where: { companyId: company.id, name: 'خشب خام (لوح)' } });
  if (!rawItem) {
    rawItem = await prisma.item.create({
      data: {
        code: 'RM-WOOD-001', name: 'Raw Wood Board', nameAr: 'خشب خام (لوح)',
        itemType: 'INVENTORY', unitOfMeasure: 'PCS', standardCost: 50, sellingPrice: 0,
        isStockItem: true, reorderLevel: 10, taxRate: 15,
        companyId: company.id, createdById: admin.id,
      },
    });
    console.log('Created raw material item:', rawItem.name);
  }

  // Finished good item
  let finishedItem = await prisma.item.findFirst({ where: { companyId: company.id, name: 'طاولة خشبية' } });
  if (!finishedItem) {
    finishedItem = await prisma.item.create({
      data: {
        code: 'FG-TABLE-001', name: 'Wooden Table', nameAr: 'طاولة خشبية',
        itemType: 'INVENTORY', unitOfMeasure: 'PCS', standardCost: 250, sellingPrice: 450,
        isStockItem: true, reorderLevel: 5, taxRate: 15,
        companyId: company.id, createdById: admin.id,
      },
    });
    console.log('Created finished good item:', finishedItem.name);
  }

  // Opening stock for the raw material so a work order can actually be completed
  const existingBin = await prisma.binCard.findUnique({
    where: { itemId_warehouseId: { itemId: rawItem.id, warehouseId: warehouse.id } },
  });
  if (!existingBin) {
    await prisma.binCard.create({
      data: {
        itemId: rawItem.id, warehouseId: warehouse.id,
        quantity: 100, availableQty: 100, avgCost: 50, totalValue: 5000,
      },
    });
    console.log('Added opening stock: 100x Raw Wood Board');
  }

  // BOM linking finished good to raw material (5 boards per table)
  let bom = await prisma.bOM.findFirst({ where: { companyId: company.id, itemId: finishedItem.id } });
  if (!bom) {
    bom = await prisma.bOM.create({
      data: {
        bomNumber: 'BOM-DEMO-001', itemId: finishedItem.id, quantity: 1, isDefault: true,
        companyId: company.id, createdById: admin.id,
        rawMaterials: { create: [{ itemId: rawItem.id, quantity: 5, rate: 50, amount: 250 }] },
      },
    });
    console.log('Created BOM linking Wooden Table to Raw Wood Board (5 boards per table)');
  }

  // Demo project + task
  let project = await prisma.project.findFirst({ where: { companyId: company.id, name: 'مشروع تجريبي - أثاث المكتب' } });
  if (!project) {
    project = await prisma.project.create({
      data: {
        projectCode: 'PRJ-DEMO-001', name: 'مشروع تجريبي - أثاث المكتب',
        description: 'مشروع توضيحي لإنتاج وتوريد أثاث مكتبي، يربط بين التصنيع والمخزون والمشاريع',
        startDate: new Date(), estimatedCost: 5000, status: 'IN_PROGRESS', priority: 'MEDIUM',
        companyId: company.id, createdById: admin.id,
      },
    });
    await prisma.task.create({
      data: {
        taskCode: 'TSK-DEMO-001', title: 'تصنيع 10 طاولات للدفعة الأولى',
        description: 'إنشاء أمر إنتاج من التصنيع وربطه بهذا المشروع', status: 'TODO', priority: 'HIGH',
        projectId: project.id,
      },
    });
    console.log('Created demo project with one task:', project.name);
  }

  console.log('\nDemo data ready:');
  console.log(`  Warehouse:      ${warehouse.name}`);
  console.log(`  Raw material:   ${rawItem.name} (100 in stock)`);
  console.log(`  Finished good:  ${finishedItem.name}`);
  console.log(`  BOM:            ${bom.bomNumber} (5x ${rawItem.name} -> 1x ${finishedItem.name})`);
  console.log(`  Project:        ${project.name} (with 1 task)`);
  console.log('\nGo to Manufacturing > Work Orders to create and complete a work order using this BOM,');
  console.log('or Projects to see the linked task.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
