import request from 'supertest';
import { app } from '../src/server';
import prisma from '../src/utils/prisma';

describe('Items API', () => {
  let authToken: string;
  let companyId: string;
  let itemId: string;

  const testItem = {
    code: `ITEM-${Date.now()}`,
    name: 'Test Item',
    nameAr: 'صنف تجريبي',
    description: 'Test item description',
    sellingPrice: 100,
    standardCost: 50,
    unitOfMeasure: 'PCS',
    itemGroup: 'Electronics',
    itemType: 'INVENTORY',
  };

  beforeAll(async () => {
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: `item_test_${Date.now()}@example.com`,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
      });

    authToken = userRes.body.data.token;

    const companyRes = await request(app)
      .post('/api/companies')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Item Test Company',
        taxId: '3333333333',
        currency: 'SAR',
      });

    companyId = companyRes.body.data.company.id;
    authToken = companyRes.body.data.token;
  });

  afterAll(async () => {
    await prisma.item.deleteMany({ where: { name: { contains: 'Test Item' } } });
    await prisma.company.deleteMany({ where: { name: { contains: 'Item Test Company' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'item_test_' } } });
    await prisma.$disconnect();
  });

  describe('POST /api/items', () => {
    it('should create a new item', async () => {
      const res = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...testItem, companyId })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(testItem.name);
      itemId = res.body.data.id;
    });
  });

  describe('GET /api/items', () => {
    it('should get all items', async () => {
      const res = await request(app)
        .get('/api/items')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ companyId })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/items/:id', () => {
    it('should get item by ID', async () => {
      const res = await request(app)
        .get(`/api/items/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(itemId);
    });
  });

  describe('PUT /api/items/:id', () => {
    it('should update item', async () => {
      const res = await request(app)
        .put(`/api/items/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ sellingPrice: 150 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Number(res.body.data.sellingPrice)).toBe(150);
    });
  });

  describe('DELETE /api/items/:id', () => {
    it('should delete item', async () => {
      const res = await request(app)
        .delete(`/api/items/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
