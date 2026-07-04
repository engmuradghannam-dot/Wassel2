import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const warehouseSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(2),
  nameAr: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  isDefault: z.boolean().default(false),
  allowNegative: z.boolean().default(false),
});

function generateCode(prefix: string) {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}${rand}`;
}

export const createWarehouse = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = warehouseSchema.parse(req.body);
    const companyId = req.body?.companyId || req.query.companyId || req.user?.companyId;
    if (!companyId) throw new AppError('Company ID required', 400);

    const warehouse = await prisma.warehouse.create({
      data: { ...data, code: data.code || generateCode('WH'), companyId },
    });

    res.status(201).json(successResponse(warehouse, 'Warehouse created'));
  } catch (error: any) {
    if (error?.code === 'P2002') return next(new AppError('Warehouse code already exists', 409));
    next(error);
  }
};

export const getWarehouses = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.body?.companyId || req.query.companyId || req.user?.companyId;
    if (!companyId) throw new AppError('Company ID required', 400);

    const warehouses = await prisma.warehouse.findMany({
      where: { companyId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    res.json(successResponse(warehouses));
  } catch (error) {
    next(error);
  }
};

export const updateWarehouse = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = warehouseSchema.partial().parse(req.body);
    const warehouse = await prisma.warehouse.update({ where: { id }, data });
    res.json(successResponse(warehouse, 'Warehouse updated'));
  } catch (error) {
    next(error);
  }
};

export const deleteWarehouse = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.warehouse.update({ where: { id }, data: { status: 'INACTIVE' } });
    res.json(successResponse(null, 'Warehouse deactivated'));
  } catch (error) {
    next(error);
  }
};

// Stock levels per warehouse (BinCard)
export const getStockLevels = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.body?.companyId || req.query.companyId || req.user?.companyId;
    if (!companyId) throw new AppError('Company ID required', 400);
    const warehouseId = req.query.warehouseId as string | undefined;

    const bins = await prisma.binCard.findMany({
      where: {
        warehouse: { companyId },
        ...(warehouseId ? { warehouseId } : {}),
      },
      include: {
        item: { select: { name: true, code: true, unitOfMeasure: true } },
        warehouse: { select: { name: true } },
      },
      orderBy: { lastMovement: 'desc' },
    });

    res.json(successResponse(bins));
  } catch (error) {
    next(error);
  }
};
