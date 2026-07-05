import request from 'supertest';
import { app } from '../src/server';
import prisma from '../src/utils/prisma';

describe('New ERP Features Smoke Test', () => {
  let authToken: string;
  let companyId: string;
  let customerId: string;
  let itemId: string;

  beforeAll(async () => {
    const userRes = await request(app).post('/api/auth/register').send({
      email: `smoke_test_${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Smoke',
      lastName: 'Test',
    });
    authToken = userRes.body.data.token;

    const companyRes = await request(app).post('/api/companies')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Smoke Test Company', taxId: '9999999999', currency: 'SAR' });
    companyId = companyRes.body.data.company.id;
    authToken = companyRes.body.data.token;

    const customerRes = await request(app).post('/api/customers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Smoke Test Customer', companyId, customerType: 'COMPANY', customerGroup: 'VIP' });
    customerId = customerRes.body.data.id;

    const itemRes = await request(app).post('/api/items')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ code: `SMOKE-${Date.now()}`, name: 'Smoke Test Item', sellingPrice: 100, companyId });
    itemId = itemRes.body.data.id;
  });

  afterAll(async () => {
    const users = await prisma.user.findMany({ where: { email: { contains: 'smoke_test_' } }, select: { id: true } });
    const ids = users.map(u => u.id);
    if (ids.length) {
      const companies = await prisma.company.findMany({ where: { createdById: { in: ids } }, select: { id: true } });
      const companyIds = companies.map(c => c.id);
      await prisma.bOM.deleteMany({ where: { companyId: { in: companyIds } } });
      await prisma.invoice.deleteMany({ where: { companyId: { in: companyIds } } });
      await prisma.company.deleteMany({ where: { id: { in: companyIds } } });
    }
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  });

  it('Contact Persons: create + list', async () => {
    const res = await request(app).post('/api/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ firstName: 'Ali', lastName: 'Hassan', email: 'ali@test.com', customerId })
      .expect(201);
    expect(res.body.data.firstName).toBe('Ali');

    const list = await request(app).get('/api/contacts').set('Authorization', `Bearer ${authToken}`).query({ customerId }).expect(200);
    expect(list.body.data.length).toBe(1);
  });

  it('Bank Details: create with IBAN/SWIFT', async () => {
    const res = await request(app).post('/api/bank-details')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ accountName: 'Test Account', bankName: 'Al Rajhi Bank', iban: 'SA0380000000608010167519', swiftCode: 'RJHISARI', customerId })
      .expect(201);
    expect(res.body.data.iban).toBe('SA0380000000608010167519');
  });

  it('Bank Details: rejects invalid IBAN', async () => {
    await request(app).post('/api/bank-details')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ accountName: 'Bad', bankName: 'X', iban: 'not-an-iban', customerId })
      .expect(400);
  });

  it('Partner Functions: create SHIP_TO', async () => {
    const res = await request(app).post('/api/partner-functions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ type: 'SHIP_TO', name: 'Warehouse Dock 3', city: 'Riyadh', customerId })
      .expect(201);
    expect(res.body.data.type).toBe('SHIP_TO');
  });

  it('UOM Conversion: create + convert quantity', async () => {
    await request(app).post('/api/uom-conversions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ itemId, uom: 'BOX', conversionFactor: 12 })
      .expect(201);

    const res = await request(app).post('/api/uom-conversions/convert')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ itemId, uom: 'BOX', quantity: 3 })
      .expect(200);
    expect(res.body.data.baseQuantity).toBe(36);
  });

  it('Price List: resolve price falls back to item base price', async () => {
    const res = await request(app).get('/api/price-lists/resolve-price')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ itemId, quantity: 1 })
      .expect(200);
    expect(res.body.data.source).toBe('ITEM_BASE_PRICE');
    expect(res.body.data.price).toBe(100);
  });

  it('Price List: custom price list overrides base price', async () => {
    const plRes = await request(app).post('/api/price-lists')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'VIP List', isDefault: true })
      .expect(201);

    await request(app).post(`/api/price-lists/${plRes.body.data.id}/items`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ itemId, price: 75, minQty: 1 })
      .expect(201);

    const res = await request(app).get('/api/price-lists/resolve-price')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ itemId, quantity: 1 })
      .expect(200);
    expect(res.body.data.price).toBe(75);
    expect(res.body.data.source).toBe('DEFAULT_PRICE_LIST');
  });

  it('Cost Center: create + report', async () => {
    const res = await request(app).post('/api/cost-centers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ code: 'CC-001', name: 'Operations' })
      .expect(201);

    const report = await request(app).get(`/api/cost-centers/${res.body.data.id}/report`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    expect(report.body.data.totalAmount).toBe(0);
  });

  it('Batch: create with expiry tracking', async () => {
    const res = await request(app).post('/api/batches')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ itemId, batchNumber: 'BATCH-001', initialQuantity: 100, expiryDate: new Date(Date.now() + 90*24*60*60*1000).toISOString() })
      .expect(201);
    expect(Number(res.body.data.currentQuantity)).toBe(100);
  });

  it('Serial Numbers: bulk create', async () => {
    const res = await request(app).post('/api/serial-numbers/bulk')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ itemId, serials: ['SN-001', 'SN-002', 'SN-003'] })
      .expect(201);
    expect(res.body.data.count).toBe(3);
  });

  it('BOM: multi-level explosion', async () => {
    const subItemRes = await request(app).post('/api/items')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ code: `SUB-${Date.now()}`, name: 'Sub Assembly', sellingPrice: 50, companyId });
    const subItemId = subItemRes.body.data.id;

    const rawItemRes = await request(app).post('/api/items')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ code: `RAW-${Date.now()}`, name: 'Raw Material', sellingPrice: 10, companyId });
    const rawItemId = rawItemRes.body.data.id;

    // Sub-assembly's own BOM (level 2)
    await request(app).post('/api/manufacturing/boms')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ itemId: subItemId, isDefault: true, rawMaterials: [{ itemId: rawItemId, quantity: 2, rate: 10 }] })
      .expect(201);

    // Top-level BOM referencing the sub-assembly
    const topBomRes = await request(app).post('/api/manufacturing/boms')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ itemId, isDefault: true, rawMaterials: [{ itemId: subItemId, quantity: 1, rate: 50, isSubAssembly: true }] })
      .expect(201);

    const explosion = await request(app).get(`/api/manufacturing/boms/${topBomRes.body.data.id}/explode`)
      .set('Authorization', `Bearer ${authToken}`)
      .query({ quantity: 5 })
      .expect(200);

    expect(explosion.body.data.components.length).toBe(2);
    expect(explosion.body.data.components[0].isSubAssembly).toBe(true);
    expect(explosion.body.data.components[0].quantity).toBe(5);
    expect(explosion.body.data.components[1].quantity).toBe(10); // 5 * 2 raw materials per sub-assembly
  });

  it('MRP: run and check for exceptions', async () => {
    await request(app).put(`/api/items/${itemId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ reorderLevel: 10 })
      .expect(200);

    const res = await request(app).post('/api/mrp/run')
      .set('Authorization', `Bearer ${authToken}`)
      .send({})
      .expect(201);
    expect(res.body.data.status).toBe('COMPLETED');
  });

  it('Sales Forecast: rejects when no historical data', async () => {
    await request(app).post('/api/sales-forecasts/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ method: 'MOVING_AVERAGE' })
      .expect(400);
  });

  it('IoT Device: register + ingest reading', async () => {
    const res = await request(app).post('/api/iot-devices')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ deviceCode: 'SENSOR-01', deviceType: 'TEMP_SENSOR' })
      .expect(201);

    const reading = await request(app).post(`/api/iot-devices/${res.body.data.id}/readings`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ metric: 'temperature', value: 4.5, unit: 'C' })
      .expect(201);
    expect(Number(reading.body.data.value)).toBe(4.5);
  });

  it('Consolidation: link subsidiary and get group structure', async () => {
    const subCompanyRes = await request(app).post('/api/companies')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Smoke Test Subsidiary', taxId: '8888888888', currency: 'SAR' });
    const subCompanyId = subCompanyRes.body.data.company.id;
    const subAuthToken = subCompanyRes.body.data.token;

    await request(app).put(`/api/company-groups/${subCompanyId}/parent`)
      .set('Authorization', `Bearer ${subAuthToken}`)
      .send({ parentCompanyId: companyId })
      .expect(200);

    const group = await request(app).get(`/api/company-groups/${companyId}/group`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    expect(group.body.data.subsidiaries.length).toBe(1);
  });

  it('Invoice: three-way match reports UNMATCHED with no PO', async () => {
    const invRes = await request(app).post('/api/invoices')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        invoiceType: 'SALES',
        invoiceDate: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        companyId,
        customerId,
        items: [{ itemId, quantity: 1, unitPrice: 100 }],
      })
      .expect(201);

    const match = await request(app).post(`/api/invoices/${invRes.body.data.id}/match`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    expect(match.body.data.matchStatus).toBe('UNMATCHED');
  });
});
