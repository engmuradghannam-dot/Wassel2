// MuradERP Full Test Data Seeder
// Creates a comprehensive set of realistic linked test data across the main
// modules: employees, customers, suppliers, items, sales orders, purchase
// orders, and a submitted invoice with a ZATCA QR code.
// Safe to re-run — skips anything that already exists by unique code/number.
//
// Usage: npm run db:seed-full   (run AFTER npm run db:seed)

import { PrismaClient } from '@prisma/client';
import { buildZatcaTlvBase64 } from '../../src/utils/zatca';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!admin) {
    console.log('No admin user found — run "npm run db:seed" first.');
    return;
  }

  const company = await prisma.company.findFirst({ where: { status: 'ACTIVE' } });
  if (!company) {
    console.log('No company found — run "npm run db:seed" first.');
    return;
  }

  console.log(`Using company: ${company.name} (${company.id})\n`);

  // ---------- Employees ----------
  const employeesData = [
    { employeeNumber: 'EMP-001', firstName: 'أحمد', lastName: 'السالم', nameAr: 'أحمد السالم', email: 'ahmed.salem@wassel.local', department: 'المبيعات', designation: 'مندوب مبيعات', basicSalary: 8000 },
    { employeeNumber: 'EMP-002', firstName: 'سارة', lastName: 'المطيري', nameAr: 'سارة المطيري', email: 'sara.mutairi@wassel.local', department: 'المحاسبة', designation: 'محاسبة', basicSalary: 9000 },
    { employeeNumber: 'EMP-003', firstName: 'خالد', lastName: 'العتيبي', nameAr: 'خالد العتيبي', email: 'khalid.otaibi@wassel.local', department: 'المستودعات', designation: 'أمين مستودع', basicSalary: 6500 },
  ];
  for (const e of employeesData) {
    const exists = await prisma.employee.findUnique({ where: { employeeNumber: e.employeeNumber } });
    if (!exists) {
      await prisma.employee.create({
        data: { ...e, totalSalary: e.basicSalary, dateOfJoining: new Date('2026-01-01'), companyId: company.id },
      });
      console.log(`Created employee: ${e.nameAr}`);
    }
  }

  // ---------- Customers ----------
  const customersData = [
    { code: 'CUST-001', name: 'Al Najah Trading Co', nameAr: 'شركة النجاح للتجارة', email: 'info@alnajah.sa', phone: '0112345678', city: 'الرياض' },
    { code: 'CUST-002', name: 'Gulf Retail Group', nameAr: 'مجموعة الخليج للتجزئة', email: 'contact@gulfretail.sa', phone: '0113456789', city: 'جدة' },
  ];
  const customers = [];
  for (const c of customersData) {
    let cust = await prisma.customer.findUnique({ where: { code: c.code } });
    if (!cust) {
      cust = await prisma.customer.create({ data: { ...c, companyId: company.id, createdById: admin.id } });
      console.log(`Created customer: ${c.nameAr}`);
    }
    customers.push(cust);
  }

  // ---------- Suppliers ----------
  const suppliersData = [
    { code: 'SUPP-001', name: 'Golden Supply Est', nameAr: 'مؤسسة التوريد الذهبي', email: 'sales@goldensupply.sa', phone: '0114567890', city: 'الدمام' },
    { code: 'SUPP-002', name: 'Modern Materials Co', nameAr: 'شركة المواد الحديثة', email: 'info@modernmaterials.sa', phone: '0115678901', city: 'الرياض' },
  ];
  const suppliers = [];
  for (const s of suppliersData) {
    let sup = await prisma.supplier.findUnique({ where: { code: s.code } });
    if (!sup) {
      sup = await prisma.supplier.create({ data: { ...s, companyId: company.id, createdById: admin.id } });
      console.log(`Created supplier: ${s.nameAr}`);
    }
    suppliers.push(sup);
  }

  // ---------- Items ----------
  const itemsData = [
    { code: 'ITEM-001', name: 'Dell Laptop', nameAr: 'لابتوب ديل', standardCost: 2200, sellingPrice: 3000 },
    { code: 'ITEM-002', name: 'Office Chair', nameAr: 'كرسي مكتب', standardCost: 300, sellingPrice: 550 },
    { code: 'ITEM-003', name: 'A4 Paper Ream', nameAr: 'ورق طباعة A4', standardCost: 15, sellingPrice: 25 },
  ];
  const items = [];
  for (const i of itemsData) {
    let item = await prisma.item.findUnique({ where: { code: i.code } });
    if (!item) {
      item = await prisma.item.create({ data: { ...i, companyId: company.id, createdById: admin.id } });
      console.log(`Created item: ${i.nameAr}`);
    }
    items.push(item);
  }

  // ---------- Sales Order ----------
  const soNumber = 'SO-DEMO-001';
  let salesOrder = await prisma.salesOrder.findUnique({ where: { orderNumber: soNumber } });
  if (!salesOrder) {
    const qty = 2;
    const unitPrice = Number(items[0].sellingPrice);
    const subtotal = qty * unitPrice;
    const taxAmount = subtotal * 0.15;
    salesOrder = await prisma.salesOrder.create({
      data: {
        orderNumber: soNumber,
        orderDate: new Date(),
        customerId: customers[0].id,
        subtotal,
        taxAmount,
        totalAmount: subtotal + taxAmount,
        status: 'CONFIRMED',
        companyId: company.id,
        createdById: admin.id,
        items: {
          create: [{ itemId: items[0].id, quantity: qty, unitPrice, taxRate: 15, totalAmount: subtotal + taxAmount }],
        },
      },
    });
    console.log(`Created sales order: ${soNumber} (${subtotal + taxAmount} SAR)`);
  }

  // ---------- Purchase Order ----------
  const poNumber = 'PO-DEMO-001';
  let purchaseOrder = await prisma.purchaseOrder.findUnique({ where: { orderNumber: poNumber } });
  if (!purchaseOrder) {
    const qty = 5;
    const unitPrice = Number(items[0].standardCost);
    const subtotal = qty * unitPrice;
    const taxAmount = subtotal * 0.15;
    purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        orderNumber: poNumber,
        orderDate: new Date(),
        supplierId: suppliers[0].id,
        subtotal,
        taxAmount,
        totalAmount: subtotal + taxAmount,
        status: 'CONFIRMED',
        companyId: company.id,
        createdById: admin.id,
        items: {
          create: [{ itemId: items[0].id, quantity: qty, unitPrice, taxRate: 15, totalAmount: subtotal + taxAmount }],
        },
      },
    });
    console.log(`Created purchase order: ${poNumber} (${subtotal + taxAmount} SAR)`);
  }

  // ---------- Submitted Sales Invoice with ZATCA QR ----------
  const invNumber = 'INV-DEMO-001';
  let invoice = await prisma.invoice.findUnique({ where: { invoiceNumber: invNumber } });
  if (!invoice) {
    const qty = 2;
    const unitPrice = Number(items[1].sellingPrice);
    const subtotal = qty * unitPrice;
    const taxAmount = subtotal * 0.15;
    const totalAmount = subtotal + taxAmount;

    const zatcaQrCode = buildZatcaTlvBase64({
      sellerName: company.name,
      vatNumber: company.taxId || '300000000000003',
      timestamp: new Date(),
      invoiceTotal: totalAmount,
      vatTotal: taxAmount,
    });

    invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: invNumber,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        invoiceType: 'SALES',
        customerId: customers[1].id,
        subtotal,
        taxAmount,
        totalAmount,
        balanceDue: totalAmount,
        status: 'SUBMITTED',
        zatcaQrCode,
        companyId: company.id,
        createdById: admin.id,
        items: {
          create: [{
            itemId: items[1].id, quantity: qty, unitPrice, taxRate: 15,
            taxAmount, totalAmount,
          }],
        },
      },
    });
    console.log(`Created submitted invoice: ${invNumber} (${totalAmount} SAR) with ZATCA QR`);
  }

  console.log('\n✅ Full test data ready:');
  console.log(`  Employees: ${employeesData.length}`);
  console.log(`  Customers: ${customersData.length}`);
  console.log(`  Suppliers: ${suppliersData.length}`);
  console.log(`  Items: ${itemsData.length}`);
  console.log(`  Sales Order: ${soNumber}`);
  console.log(`  Purchase Order: ${poNumber}`);
  console.log(`  Invoice: ${invNumber}`);
  console.log('\nLog in and check Dashboard, Customers, Suppliers, Items, Sales Orders, Purchase Orders, and Invoices pages.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
