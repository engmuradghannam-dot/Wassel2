import request from 'supertest';
import { app } from '../src/server';
import prisma from '../src/utils/prisma';

describe('Companies API', () => {
  let authToken: string;
  let companyId: string;

  const testCompany = {
    name: 'Test Company',
    nameAr: 'شركة تجريبية',
    taxId: '1234567890',
    address: '123 Test Street',
    phone: '+966501234567',
    email: 'test@company.com',
    defaultCurrency: 'SAR',
  };

  beforeAll(async () => {
    // Create a test user and get token
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: `company_test_${Date.now()}@example.com`,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'Admin',
      });

    authToken = userRes.body.data.token;
  });

  afterAll(async () => {
    await prisma.company.deleteMany({ where: { name: { contains: 'Test Company' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'company_test_' } } });
    await prisma.$disconnect();
  });

  describe('POST /api/companies', () => {
    it('should create a new company', async () => {
      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testCompany)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(testCompany.name);
      companyId = res.body.data.id;
    });

    it('should not create company without auth', async () => {
      const res = await request(app)
        .post('/api/companies')
        .send(testCompany)
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/companies', () => {
    it('should get all companies', async () => {
      const res = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/companies/:id', () => {
    it('should get company by ID', async () => {
      const res = await request(app)
        .get(`/api/companies/${companyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(companyId);
    });

    it('should return 404 for non-existent company', async () => {
      const res = await request(app)
        .get('/api/companies/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/companies/:id', () => {
    it('should update company', async () => {
      const res = await request(app)
        .put(`/api/companies/${companyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Company Name' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Company Name');
    });
  });

  describe('DELETE /api/companies/:id', () => {
    it('should delete company', async () => {
      const res = await request(app)
        .delete(`/api/companies/${companyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
