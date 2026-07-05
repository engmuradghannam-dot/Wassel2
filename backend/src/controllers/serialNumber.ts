import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const serialSchema = z.object({
  itemId: z.string(),
  serialNo: z.string().min(1),
  warehouseId: z.string().optional(),
  warrantyExpiry: z.string().datetime().optional(),
});

async function assertItemInCompany(companyId: string, itemId: string) {
  const item = await prisma.item.findFirst({ where: { id: itemId, companyId } });
  if (!item) throw new AppError('Item not found', 404);
}

export const createSerialNumber = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = serialSchema.parse(req.body);
    const companyId = req.companyId!;
    await assertItemInCompany(companyId, data.itemId);

    const serial = await prisma.serialNumber.create({
      data: { ...data, companyId },
    });

    res.status(201).json(successResponse(serial, 'Serial number registered'));
  } catch (error) {
    next(error);
  }
};

// Bulk-register a range/list of serial numbers for a stock receipt in one call.
export const bulkCreateSerialNumbers = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const bulkSchema = z.object({
      itemId: z.string(),
      warehouseId: z.string().optional(),
      serials: z.array(z.string().min(1)).min(1),
    });
    const data = bulkSchema.parse(req.body);
    await assertItemInCompany(companyId, data.itemId);

    const created = await prisma.serialNumber.createMany({
      data: data.serials.map((serialNo) => ({
        itemId: data.itemId,
        warehouseId: data.warehouseId,
        serialNo,
        companyId,
      })),
      skipDuplicates: true,
    });

    res.status(201).json(successResponse(created, `${created.count} serial numbers registered`));
  } catch (error) {
    next(error);
  }
};

export const getSerialNumbers = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { itemId, warehouseId, status } = req.query;

    const where: any = { companyId };
    if (itemId) where.itemId = itemId as string;
    if (warehouseId) where.warehouseId = warehouseId as string;
    if (status) where.status = status as string;

    const serials = await prisma.serialNumber.findMany({
      where,
      include: { item: { select: { name: true, code: true } }, warehouse: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(successResponse(serials));
  } catch (error) {
    next(error);
  }
};

export const updateSerialNumberStatus = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const existing = await prisma.serialNumber.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Serial number not found', 404);

    const updateSchema = z.object({
      status: z.enum(['AVAILABLE', 'RESERVED', 'SOLD', 'DEFECTIVE', 'RETURNED']),
      referenceType: z.string().optional(),
      referenceId: z.string().optional(),
    });
    const data = updateSchema.parse(req.body);

    const serial = await prisma.serialNumber.update({ where: { id }, data });
    res.json(successResponse(serial, 'Serial number status updated'));
  } catch (error) {
    next(error);
  }
};

export const deleteSerialNumber = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const existing = await prisma.serialNumber.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Serial number not found', 404);

    await prisma.serialNumber.delete({ where: { id } });
    res.json(successResponse(null, 'Serial number deleted'));
  } catch (error) {
    next(error);
  }
};
