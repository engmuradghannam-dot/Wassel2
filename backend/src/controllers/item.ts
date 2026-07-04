import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const itemSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(2),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  itemType: z.enum(['INVENTORY', 'NON_INVENTORY']).default('INVENTORY'),
  itemGroup: z.string().optional(),
  brand: z.string().optional(),
  unitOfMeasure: z.string().default('PCS'),
  standardCost: z.number().min(0).default(0),
  sellingPrice: z.number().min(0).default(0),
  isStockItem: z.boolean().default(true),
  reorderLevel: z.number().min(0).default(0),
  reorderQuantity: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(15),
});

function generateCode(prefix: string) {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}${rand}`;
}

export const createItem = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = itemSchema.parse(req.body);
    const companyId = req.companyId!;

    if (!companyId) {
      throw new AppError('Company ID required', 400);
    }

    const item = await prisma.item.create({
      data: {
        ...data,
        code: data.code || generateCode('ITEM'),
        companyId,
        createdById: req.user.userId,
      },
    });

    res.status(201).json(successResponse(item, 'Item created successfully'));
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return next(new AppError('Item code already exists', 409));
    }
    next(error);
  }
};

export const getItems = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    if (!companyId) {
      throw new AppError('Company ID required', 400);
    }
    const search = (req.query.search as string) || '';

    const items = await prisma.item.findMany({
      where: {
        companyId,
        status: 'ACTIVE',
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(successResponse(items));
  } catch (error) {
    next(error);
  }
};

export const getItem = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const item = await prisma.item.findUnique({ where: { id } });

    if (!item) {
      throw new AppError('Item not found', 404);
    }

    res.json(successResponse(item));
  } catch (error) {
    next(error);
  }
};

export const updateItem = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = itemSchema.partial().parse(req.body);

    const item = await prisma.item.update({
      where: { id },
      data,
    });

    res.json(successResponse(item, 'Item updated'));
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return next(new AppError('Item code already exists', 409));
    }
    next(error);
  }
};

export const deleteItem = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.item.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    res.json(successResponse(null, 'Item deactivated'));
  } catch (error) {
    next(error);
  }
};
