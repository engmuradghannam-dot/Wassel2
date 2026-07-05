import request from 'supertest';
import { app } from '../src/server';
import prisma from '../src/utils/prisma';

describe('Customers API', () => {
  let authToken: string;
  let companyId: string;
  let customerId: string;

  const testCustomer = {
    name: 'Test Customer',
    nameAr: 'عميل تجريبي',
    email: 'customer@test.com',
    phone: '+966501234567',
    taxId: '9876543210',
    creditLimit: 10000,
    paymentTerms: 30,
    customerType: 'INDIVIDUAL',
  };

  beforeAll(async () => {
    // Create test user and company
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: `customer_test_${Date.now()}@example.com`,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
      });

    authToken = userRes.body.data.token;

    const companyRes = await request(app)
      .post('/api/companies')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Customer Test Company',
        taxId: '1111111111',
        defaultCurrency: 'SAR',
      });

    companyId = companyRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.customer.deleteMany({ where: { name: { contains: 'Test Customer' } } });
    await prisma.company.deleteMany({ where: { name: { contains: 'Customer Test Company' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'customer_test_' } } });
    await prisma.$disconnect();
  });

  describe('POST /api/customers', () => {
    it('should create a new customer', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...testCustomer, companyId })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(testCustomer.name);
      customerId = res.body.data.id;
    });

    it('should not create customer without companyId', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testCustomer)
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/customers', () => {
    it('should get all customers for company', async () => {
      const res = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ companyId })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/customers/:id', () => {
    it('should get customer by ID', async () => {
      const res = await request(app)
        .get(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(customerId);
    });
  });

  describe('PUT /api/customers/:id', () => {
    it('should update customer', async () => {
      const res = await request(app)
        .put(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ creditLimit: 20000 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.creditLimit).toBe(20000);
    });
  });

  describe('DELETE /api/customers/:id', () => {
    it('should delete customer', async () => {
      const res = await request(app)
        .delete(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
