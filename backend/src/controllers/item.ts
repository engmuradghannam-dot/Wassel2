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
  oldItemCode: z.string().optional(),
  manufacturerName: z.string().optional(),
  manufacturerPartNumber: z.string().optional(),
  barcode: z.string().optional(),

  itemType: z.enum(['INVENTORY', 'NON_INVENTORY', 'SERVICE', 'ASSET', 'RAW_MATERIAL', 'FINISHED_GOOD']).default('INVENTORY'),
  itemGroup: z.string().optional(),
  division: z.string().optional(),
  brand: z.string().optional(),
  countryOfOrigin: z.string().default('SA'),
  hsCode: z.string().optional(),

  unitOfMeasure: z.string().default('PCS'),
  grossWeight: z.number().min(0).optional(),
  netWeight: z.number().min(0).optional(),
  weightUnit: z.string().default('KG'),
  volume: z.number().min(0).optional(),
  volumeUnit: z.string().default('M3'),
  length: z.number().min(0).optional(),
  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),

  standardCost: z.number().min(0).default(0),
  sellingPrice: z.number().min(0).default(0),
  priceControl: z.enum(['STANDARD', 'MOVING_AVERAGE']).default('STANDARD'),

  salesUnitOfMeasure: z.string().optional(),
  minOrderQuantity: z.number().min(0).optional(),
  deliveryTimeDays: z.number().int().min(0).optional(),

  purchasingUnitOfMeasure: z.string().optional(),
  purchasingGroup: z.string().optional(),
  preferredSupplierId: z.string().optional(),
  goodsReceiptBasedInvoiceVerification: z.boolean().default(true),

  isStockItem: z.boolean().default(true),
  batchManaged: z.boolean().default(false),
  serialManaged: z.boolean().default(false),
  shelfLifeDays: z.number().int().min(0).optional(),
  storageConditions: z.string().optional(),
  isHazardous: z.boolean().default(false),

  procurementType: z.enum(['BUY', 'MAKE']).default('BUY'),
  lotSizingProcedure: z.enum(['LOT_FOR_LOT', 'FIXED_QTY', 'REORDER_POINT']).default('LOT_FOR_LOT'),
  safetyStock: z.number().min(0).default(0),
  planningTimeFenceDays: z.number().int().min(0).default(0),

  reorderLevel: z.number().min(0).default(0),
  reorderQuantity: z.number().min(0).default(0),

  qualityInspectionRequired: z.boolean().default(false),

  taxRate: z.number().min(0).max(100).default(15),
  taxClassification: z.enum(['STANDARD_RATED', 'ZERO_RATED', 'EXEMPT']).default('STANDARD_RATED'),
});

function generateCode(prefix: string) {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}${rand}`;
}

// IDOR guard: preferredSupplierId must belong to the caller's company.
async function assertReferencesInCompany(companyId: string, data: { preferredSupplierId?: string }) {
  if (data.preferredSupplierId) {
    const supplier = await prisma.supplier.findFirst({ where: { id: data.preferredSupplierId, companyId } });
    if (!supplier) throw new AppError('Preferred supplier not found', 404);
  }
}

export const createItem = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = itemSchema.parse(req.body);
    const companyId = req.companyId!;

    if (!companyId) {
      throw new AppError('Company ID required', 400);
    }
    await assertReferencesInCompany(companyId, data);

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
    const companyId = req.companyId!;
    const item = await prisma.item.findFirst({ where: { id, companyId } });

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
    const companyId = req.companyId!;
    const existing = await prisma.item.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Item not found', 404);

    const data = itemSchema.partial().parse(req.body);
    await assertReferencesInCompany(companyId, data);

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
    const companyId = req.companyId!;
    const existing = await prisma.item.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Item not found', 404);

    await prisma.item.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    res.json(successResponse(null, 'Item deactivated'));
  } catch (error) {
    next(error);
  }
};
