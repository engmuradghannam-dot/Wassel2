import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const supplierSchema = z.object({
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
  supplierType: z.enum(['COMPANY', 'INDIVIDUAL', 'IMPORTER']).default('COMPANY'),
  supplierGroup: z.string().optional(),
});

function generateCode(prefix: string) {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}${rand}`;
}

export const createSupplier = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = supplierSchema.parse(req.body);
    const companyId = req.query.companyId || req.user?.companyId;

    if (!companyId) {
      throw new AppError('Company ID required', 400);
    }

    const supplier = await prisma.supplier.create({
      data: {
        ...data,
        email: data.email || undefined,
        code: data.code || generateCode('SUPP'),
        companyId,
        createdById: req.user.userId,
      },
    });

    res.status(201).json(successResponse(supplier, 'Supplier created successfully'));
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return next(new AppError('Supplier code already exists', 409));
    }
    next(error);
  }
};

export const getSuppliers = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.query.companyId || req.user?.companyId;
    if (!companyId) {
      throw new AppError('Company ID required', 400);
    }
    const search = (req.query.search as string) || '';

    const suppliers = await prisma.supplier.findMany({
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

    res.json(successResponse(suppliers));
  } catch (error) {
    next(error);
  }
};

export const getSupplier = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({ where: { id } });

    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }

    res.json(successResponse(supplier));
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = supplierSchema.partial().parse(req.body);

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { ...data, email: data.email || undefined },
    });

    res.json(successResponse(supplier, 'Supplier updated'));
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return next(new AppError('Supplier code already exists', 409));
    }
    next(error);
  }
};

export const deleteSupplier = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.supplier.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    res.json(successResponse(null, 'Supplier deactivated'));
  } catch (error) {
    next(error);
  }
};
