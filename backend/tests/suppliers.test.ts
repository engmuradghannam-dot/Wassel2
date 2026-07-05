import request from 'supertest';
import { app } from '../src/server';
import prisma from '../src/utils/prisma';

describe('Suppliers API', () => {
  let authToken: string;
  let companyId: string;
  let supplierId: string;

  const testSupplier = {
    name: 'Test Supplier',
    nameAr: 'مورد تجريبي',
    email: 'supplier@test.com',
    phone: '+966501234567',
    taxId: '1234567890',
    paymentTerms: 60,
    supplierType: 'COMPANY',
  };

  beforeAll(async () => {
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: `supplier_test_${Date.now()}@example.com`,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
      });

    authToken = userRes.body.data.token;

    const companyRes = await request(app)
      .post('/api/companies')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Supplier Test Company',
        taxId: '2222222222',
        currency: 'SAR',
      });

    companyId = companyRes.body.data.company.id;
    authToken = companyRes.body.data.token;
  });

  afterAll(async () => {
    await prisma.supplier.deleteMany({ where: { name: { contains: 'Test Supplier' } } });
    await prisma.company.deleteMany({ where: { name: { contains: 'Supplier Test Company' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'supplier_test_' } } });
    await prisma.$disconnect();
  });

  describe('POST /api/suppliers', () => {
    it('should create a new supplier', async () => {
      const res = await request(app)
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...testSupplier, companyId })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(testSupplier.name);
      supplierId = res.body.data.id;
    });
  });

  describe('GET /api/suppliers', () => {
    it('should get all suppliers', async () => {
      const res = await request(app)
        .get('/api/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ companyId })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/suppliers/:id', () => {
    it('should get supplier by ID', async () => {
      const res = await request(app)
        .get(`/api/suppliers/${supplierId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(supplierId);
    });
  });

  describe('PUT /api/suppliers/:id', () => {
    it('should update supplier', async () => {
      const res = await request(app)
        .put(`/api/suppliers/${supplierId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ paymentTerms: 90 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.paymentTerms).toBe(90);
    });
  });

  describe('DELETE /api/suppliers/:id', () => {
    it('should delete supplier', async () => {
      const res = await request(app)
        .delete(`/api/suppliers/${supplierId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
