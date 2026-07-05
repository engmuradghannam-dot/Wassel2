import request from 'supertest';
import { app } from '../src/server';
import prisma from '../src/utils/prisma';

describe('Invoices API', () => {
  let authToken: string;
  let companyId: string;
  let customerId: string;
  let itemId: string;
  let invoiceId: string;

  beforeAll(async () => {
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: `invoice_test_${Date.now()}@example.com`,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
      });

    authToken = userRes.body.data.token;

    const companyRes = await request(app)
      .post('/api/companies')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Invoice Test Company',
        taxId: '4444444444',
        currency: 'SAR',
      });

    companyId = companyRes.body.data.company.id;
    authToken = companyRes.body.data.token;

    const customerRes = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Invoice Test Customer',
        email: 'invoice.customer@test.com',
        companyId,
        customerType: 'INDIVIDUAL',
      });

    customerId = customerRes.body.data.id;

    const itemRes = await request(app)
      .post('/api/items')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        code: `INV-ITEM-${Date.now()}`,
        name: 'Invoice Test Item',
        sellingPrice: 500,
        companyId,
      });

    itemId = itemRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.invoice.deleteMany({ where: { companyId } });
    await prisma.item.deleteMany({ where: { name: { contains: 'Invoice Test Item' } } });
    await prisma.customer.deleteMany({ where: { name: { contains: 'Invoice Test Customer' } } });
    await prisma.company.deleteMany({ where: { name: { contains: 'Invoice Test Company' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'invoice_test_' } } });
    await prisma.$disconnect();
  });

  describe('POST /api/invoices', () => {
    it('should create a new invoice', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          invoiceType: 'SALES',
          invoiceDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          companyId,
          customerId,
          items: [
            {
              itemId,
              quantity: 2,
              unitPrice: 500,
            },
          ],
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.invoiceNumber).toBeDefined();
      invoiceId = res.body.data.id;
    });
  });

  describe('GET /api/invoices', () => {
    it('should get all invoices', async () => {
      const res = await request(app)
        .get('/api/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ companyId })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/invoices/:id', () => {
    it('should get invoice by ID', async () => {
      const res = await request(app)
        .get(`/api/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(invoiceId);
    });
  });

  describe('POST /api/invoices/:id/submit', () => {
    it('should submit invoice', async () => {
      const res = await request(app)
        .post(`/api/invoices/${invoiceId}/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/invoices/:id/cancel', () => {
    it('should cancel invoice', async () => {
      const res = await request(app)
        .post(`/api/invoices/${invoiceId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
