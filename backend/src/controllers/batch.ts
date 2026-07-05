import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const batchSchema = z.object({
  itemId: z.string(),
  batchNumber: z.string().min(1),
  manufactureDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  initialQuantity: z.number().positive(),
  warehouseId: z.string().optional(),
});

async function assertItemInCompany(companyId: string, itemId: string) {
  const item = await prisma.item.findFirst({ where: { id: itemId, companyId } });
  if (!item) throw new AppError('Item not found', 404);
}

export const createBatch = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = batchSchema.parse(req.body);
    const companyId = req.companyId!;
    await assertItemInCompany(companyId, data.itemId);

    if (data.warehouseId) {
      const warehouse = await prisma.warehouse.findFirst({ where: { id: data.warehouseId, companyId } });
      if (!warehouse) throw new AppError('Warehouse not found', 404);
    }

    const batch = await prisma.batch.create({
      data: {
        ...data,
        currentQuantity: data.initialQuantity,
        companyId,
      },
    });

    res.status(201).json(successResponse(batch, 'Batch created'));
  } catch (error) {
    next(error);
  }
};

export const getBatches = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { itemId, warehouseId, status, expiringSoon } = req.query;

    const where: any = { companyId };
    if (itemId) where.itemId = itemId as string;
    if (warehouseId) where.warehouseId = warehouseId as string;
    if (status) where.status = status as string;
    if (expiringSoon === 'true') {
      where.expiryDate = { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), gte: new Date() };
    }

    const batches = await prisma.batch.findMany({
      where,
      include: { item: { select: { name: true, code: true } }, warehouse: { select: { name: true } } },
      orderBy: { expiryDate: 'asc' },
    });
    res.json(successResponse(batches));
  } catch (error) {
    next(error);
  }
};

export const getBatch = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const batch = await prisma.batch.findFirst({
      where: { id, companyId },
      include: { item: true, warehouse: true },
    });
    if (!batch) throw new AppError('Batch not found', 404);
    res.json(successResponse(batch));
  } catch (error) {
    next(error);
  }
};

export const updateBatch = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const existing = await prisma.batch.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Batch not found', 404);

    const updateSchema = z.object({
      currentQuantity: z.number().min(0).optional(),
      status: z.enum(['ACTIVE', 'EXPIRED', 'CONSUMED']).optional(),
      expiryDate: z.string().datetime().optional(),
    });
    const data = updateSchema.parse(req.body);

    const batch = await prisma.batch.update({ where: { id }, data });
    res.json(successResponse(batch, 'Batch updated'));
  } catch (error) {
    next(error);
  }
};

export const deleteBatch = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const existing = await prisma.batch.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Batch not found', 404);

    await prisma.batch.delete({ where: { id } });
    res.json(successResponse(null, 'Batch deleted'));
  } catch (error) {
    next(error);
  }
};
