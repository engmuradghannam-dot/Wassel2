import request from 'supertest';
import { app } from '../src/server';
import prisma from '../src/utils/prisma';

describe('Auth API', () => {
  const testUser = {
    email: `authtest_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    phone: '+966501234567',
  };

  let authToken: string;

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: 'authtest_' } } });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.token).toBeDefined();
    });

    it('should not register with existing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(409);

      expect(res.body.success).toBe(false);
    });

    it('should not register with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, email: 'invalid-email' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      authToken = res.body.data.token;
    });

    it('should not login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should not login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email);
    });

    it('should not get profile without token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});
