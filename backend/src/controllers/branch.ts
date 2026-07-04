import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const branchSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(2),
  nameAr: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('SA'),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  managerId: z.string().optional(),
});

function generateCode(prefix: string) {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}${rand}`;
}

export const createBranch = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = branchSchema.parse(req.body);
    const companyId = req.companyId!;

    const branch = await prisma.branch.create({
      data: { ...data, code: data.code || generateCode('BR'), companyId },
    });

    res.status(201).json(successResponse(branch, 'Branch created'));
  } catch (error: any) {
    if (error?.code === 'P2002') return next(new AppError('Branch code already exists', 409));
    next(error);
  }
};

export const getBranches = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;

    const branches = await prisma.branch.findMany({
      where: { companyId, status: 'ACTIVE' },
      include: { _count: { select: { employees: true, warehouses: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(successResponse(branches));
  } catch (error) {
    next(error);
  }
};

export const getBranch = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { id } = req.params;

    const branch = await prisma.branch.findFirst({
      where: { id, companyId },
      include: { warehouses: true, employees: true },
    });
    if (!branch) throw new AppError('Branch not found', 404);

    res.json(successResponse(branch));
  } catch (error) {
    next(error);
  }
};

export const updateBranch = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { id } = req.params;
    const data = branchSchema.partial().parse(req.body);

    const existing = await prisma.branch.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Branch not found', 404);

    const branch = await prisma.branch.update({ where: { id }, data });
    res.json(successResponse(branch, 'Branch updated'));
  } catch (error) {
    next(error);
  }
};

export const deleteBranch = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { id } = req.params;

    const existing = await prisma.branch.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Branch not found', 404);

    await prisma.branch.update({ where: { id }, data: { status: 'INACTIVE' } });
    res.json(successResponse(null, 'Branch deactivated'));
  } catch (error) {
    next(error);
  }
};
