import request from 'supertest';
import { app } from '../src/server';
import prisma from '../src/utils/prisma';

describe('Employees API', () => {
  let authToken: string;
  let companyId: string;
  let employeeId: string;

  const testEmployee = {
    employeeId: `EMP-${Date.now()}`,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@test.com',
    phone: '+966501234567',
    department: 'IT',
    designation: 'Developer',
    joinDate: new Date().toISOString().split('T')[0],
    salary: 10000,
    employmentType: 'FULL_TIME',
  };

  beforeAll(async () => {
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: `employee_test_${Date.now()}@example.com`,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
      });

    authToken = userRes.body.data.token;

    const companyRes = await request(app)
      .post('/api/companies')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Employee Test Company',
        taxId: '5555555555',
        defaultCurrency: 'SAR',
      });

    companyId = companyRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.employee.deleteMany({ where: { firstName: 'John', lastName: 'Doe' } });
    await prisma.company.deleteMany({ where: { name: { contains: 'Employee Test Company' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'employee_test_' } } });
    await prisma.$disconnect();
  });

  describe('POST /api/employees', () => {
    it('should create a new employee', async () => {
      const res = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...testEmployee, companyId })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe(testEmployee.firstName);
      employeeId = res.body.data.id;
    });
  });

  describe('GET /api/employees', () => {
    it('should get all employees', async () => {
      const res = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ companyId })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/employees/:id', () => {
    it('should get employee by ID', async () => {
      const res = await request(app)
        .get(`/api/employees/${employeeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(employeeId);
    });
  });

  describe('PUT /api/employees/:id', () => {
    it('should update employee', async () => {
      const res = await request(app)
        .put(`/api/employees/${employeeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ salary: 12000 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.salary).toBe(12000);
    });
  });

  describe('DELETE /api/employees/:id', () => {
    it('should delete employee', async () => {
      const res = await request(app)
        .delete(`/api/employees/${employeeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
