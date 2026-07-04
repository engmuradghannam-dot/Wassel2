import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const employeeSchema = z.object({
  employeeNumber: z.string().optional(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  nameAr: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  idNumber: z.string().optional(),
  passportNumber: z.string().optional(),
  nationality: z.string().default('SA'),
  department: z.string().optional(),
  designation: z.string().optional(),
  jobTitle: z.string().optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']).default('FULL_TIME'),
  dateOfBirth: z.string().datetime().optional(),
  dateOfJoining: z.string().datetime(),
  basicSalary: z.number().positive(),
  housingAllowance: z.number().min(0).default(0),
  transportAllowance: z.number().min(0).default(0),
  otherAllowance: z.number().min(0).default(0),
  branchId: z.string().optional(),
});

export const createEmployee = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = employeeSchema.parse(req.body);
    const companyId = req.body?.companyId || req.query.companyId || req.user?.companyId;

    if (!companyId) {
      throw new AppError('Company ID required', 400);
    }

    const totalSalary = data.basicSalary + data.housingAllowance + data.transportAllowance + data.otherAllowance;
    const employeeNumber = data.employeeNumber || `EMP-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const employee = await prisma.employee.create({
      data: {
        ...data,
        employeeNumber,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        dateOfJoining: new Date(data.dateOfJoining),
        totalSalary,
        companyId,
      },
    });

    res.status(201).json(successResponse(employee, 'Employee created successfully'));
  } catch (error) {
    next(error);
  }
};

export const getEmployees = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.query.companyId;
    const department = req.query.department;
    const status = req.query.status;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (department) where.department = department;
    if (status) where.status = status;

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          branch: { select: { name: true } },
          user: { select: { email: true, role: true } },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    res.json(successResponse(employees, 'Employees retrieved', {
      page, limit, total, totalPages: Math.ceil(total / limit),
    }));
  } catch (error) {
    next(error);
  }
};

export const getEmployee = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        branch: true,
        user: true,
        attendances: { orderBy: { date: 'desc' }, take: 30 },
        leaves: { orderBy: { createdAt: 'desc' }, take: 10 },
        payrolls: { orderBy: { periodStart: 'desc' }, take: 6 },
      },
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    res.json(successResponse(employee));
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = employeeSchema.partial().parse(req.body);

    const updateData: any = { ...data };
    if (data.dateOfBirth) updateData.dateOfBirth = new Date(data.dateOfBirth);
    if (data.dateOfJoining) updateData.dateOfJoining = new Date(data.dateOfJoining);

    // Recalculate total salary
    const existing = await prisma.employee.findUnique({ where: { id } });
    if (existing) {
      const basic = data.basicSalary ?? Number(existing.basicSalary);
      const housing = data.housingAllowance ?? Number(existing.housingAllowance);
      const transport = data.transportAllowance ?? Number(existing.transportAllowance);
      const other = data.otherAllowance ?? Number(existing.otherAllowance);
      updateData.totalSalary = basic + housing + transport + other;
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData,
    });

    res.json(successResponse(employee, 'Employee updated'));
  } catch (error) {
    next(error);
  }
};

export const deleteEmployee = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.employee.update({
      where: { id },
      data: { status: 'TERMINATED', dateOfLeaving: new Date() },
    });

    res.json(successResponse(null, 'Employee terminated'));
  } catch (error) {
    next(error);
  }
};
