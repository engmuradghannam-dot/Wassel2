import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const customerSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(2),
  nameAr: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('SA'),
  zipCode: z.string().optional(),
  taxId: z.string().optional(),
  commercialReg: z.string().optional(),
  creditLimit: z.number().min(0).default(0),
  paymentTerms: z.number().int().min(0).default(30),
  currency: z.string().default('SAR'),
  customerType: z.enum(['INDIVIDUAL', 'COMPANY', 'GOVERNMENT']).default('INDIVIDUAL'),
  customerGroup: z.string().optional(),
});

function generateCode(prefix: string) {
  // Customer.code is globally unique (no per-company Counter table exists yet),
  // so combine a timestamp with a short random suffix to avoid collisions.
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}${rand}`;
}

export const createCustomer = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = customerSchema.parse(req.body);
    const companyId = req.companyId!;

    if (!companyId) {
      throw new AppError('Company ID required', 400);
    }

    const customer = await prisma.customer.create({
      data: {
        ...data,
        email: data.email || undefined,
        code: data.code || generateCode('CUST'),
        companyId,
        createdById: req.user.userId,
      },
    });

    res.status(201).json(successResponse(customer, 'Customer created successfully'));
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return next(new AppError('Customer code already exists', 409));
    }
    next(error);
  }
};

export const getCustomers = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    if (!companyId) {
      throw new AppError('Company ID required', 400);
    }
    const search = (req.query.search as string) || '';

    const customers = await prisma.customer.findMany({
      where: {
        companyId,
        status: 'ACTIVE',
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(successResponse(customers));
  } catch (error) {
    next(error);
  }
};

export const getCustomer = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({ where: { id } });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    res.json(successResponse(customer));
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = customerSchema.partial().parse(req.body);

    const customer = await prisma.customer.update({
      where: { id },
      data: { ...data, email: data.email || undefined },
    });

    res.json(successResponse(customer, 'Customer updated'));
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return next(new AppError('Customer code already exists', 409));
    }
    next(error);
  }
};

export const deleteCustomer = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.customer.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    res.json(successResponse(null, 'Customer deactivated'));
  } catch (error) {
    next(error);
  }
};
