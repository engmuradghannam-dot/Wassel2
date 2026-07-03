import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const stockEntrySchema = z.object({
  entryDate: z.string().datetime(),
  entryType: z.enum(['RECEIPT', 'ISSUE', 'TRANSFER', 'ADJUSTMENT', 'RETURN', 'MANUFACTURE']),
  warehouseId: z.string(),
  reference: z.string().optional(),
  description: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().positive(),
    unitCost: z.number().min(0),
    batchNo: z.string().optional(),
  })).min(1),
});

function generateEntryNumber(prefix: string, sequence: number): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${prefix}-${year}${month}-${String(sequence).padStart(5, '0')}`;
}

// Entry types that decrease stock; everything else (RECEIPT, RETURN, MANUFACTURE,
// TRANSFER, ADJUSTMENT) is treated as increasing in this simplified model.
const DECREASING_TYPES = new Set(['ISSUE']);

export const createStockEntry = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = stockEntrySchema.parse(req.body);
    const companyId = req.query.companyId || req.user?.companyId;
    if (!companyId) throw new AppError('Company ID required', 400);

    const warehouse = await prisma.warehouse.findUnique({ where: { id: data.warehouseId } });
    if (!warehouse || warehouse.companyId !== companyId) {
      throw new AppError('Warehouse not found', 404);
    }

    const items = [];
    for (const item of data.items) {
      const itemData = await prisma.item.findUnique({ where: { id: item.itemId } });
      if (!itemData) throw new AppError(`Item not found: ${item.itemId}`, 404);
      items.push({
        itemId: item.itemId,
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost: item.quantity * item.unitCost,
        batchNo: item.batchNo,
      });
    }

    const count = await prisma.stockEntry.count({ where: { companyId } });
    const entryNumber = generateEntryNumber('STE', count + 1);

    const entry = await prisma.stockEntry.create({
      data: {
        entryNumber,
        entryDate: new Date(data.entryDate),
        entryType: data.entryType,
        reference: data.reference,
        description: data.description,
        warehouseId: data.warehouseId,
        companyId,
        createdById: req.user.userId,
        items: { create: items },
      },
      include: { items: { include: { item: true } }, warehouse: true },
    });

    res.status(201).json(successResponse(entry, 'Stock entry created'));
  } catch (error) {
    next(error);
  }
};

export const getStockEntries = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.query.companyId || req.user?.companyId;
    if (!companyId) throw new AppError('Company ID required', 400);

    const entries = await prisma.stockEntry.findMany({
      where: { companyId },
      include: { warehouse: { select: { name: true } }, _count: { select: { items: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(successResponse(entries));
  } catch (error) {
    next(error);
  }
};

// Submitting a stock entry actually moves the stock: updates BinCard balances
// and writes a StockLedger row per item with the running balance.
export const submitStockEntry = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const entry = await prisma.stockEntry.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!entry) throw new AppError('Stock entry not found', 404);
    if (entry.status !== 'DRAFT') throw new AppError('Only draft entries can be submitted', 400);

    const isDecrease = DECREASING_TYPES.has(entry.entryType);
    // TRANSFER/ADJUSTMENT/MANUFACTURE beyond RECEIPT default to increase for now (simplified model)
    const direction = isDecrease ? -1 : 1;

    await prisma.$transaction(async (tx) => {
      for (const item of entry.items) {
        const existingBin = await tx.binCard.findUnique({
          where: { itemId_warehouseId: { itemId: item.itemId, warehouseId: entry.warehouseId } },
        });

        const qtyChange = Number(item.quantity) * direction;
        const newQty = (existingBin ? Number(existingBin.quantity) : 0) + qtyChange;

        if (newQty < 0 && !(await tx.warehouse.findUnique({ where: { id: entry.warehouseId } }))!.allowNegative) {
          throw new AppError(`Insufficient stock for item in warehouse (would go negative)`, 400);
        }

        const prevValue = existingBin ? Number(existingBin.totalValue) : 0;
        const valueChange = Number(item.totalCost) * direction;
        const newValue = Math.max(prevValue + valueChange, 0);
        const newAvgCost = newQty > 0 ? newValue / newQty : 0;

        await tx.binCard.upsert({
          where: { itemId_warehouseId: { itemId: item.itemId, warehouseId: entry.warehouseId } },
          create: {
            itemId: item.itemId,
            warehouseId: entry.warehouseId,
            quantity: newQty,
            availableQty: newQty,
            avgCost: newAvgCost,
            totalValue: newValue,
          },
          update: {
            quantity: newQty,
            availableQty: newQty,
            avgCost: newAvgCost,
            totalValue: newValue,
            lastMovement: new Date(),
          },
        });

        await tx.stockLedger.create({
          data: {
            entryDate: entry.entryDate,
            itemId: item.itemId,
            warehouseId: entry.warehouseId,
            entryType: entry.entryType,
            quantity: Math.abs(qtyChange),
            unitCost: item.unitCost,
            totalCost: item.totalCost,
            balanceQty: newQty,
            balanceValue: newValue,
            reference: entry.entryNumber,
          },
        });
      }

      await tx.stockEntry.update({ where: { id }, data: { status: 'SUBMITTED' } });
    });

    res.json(successResponse(null, 'Stock entry submitted and stock updated'));
  } catch (error) {
    next(error);
  }
};

export const cancelStockEntry = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const entry = await prisma.stockEntry.findUnique({ where: { id } });
    if (!entry) throw new AppError('Stock entry not found', 404);
    if (entry.status === 'SUBMITTED') {
      throw new AppError('Submitted entries already affected stock; cannot cancel directly. Create a reversing entry instead.', 400);
    }
    await prisma.stockEntry.update({ where: { id }, data: { status: 'CANCELLED' } });
    res.json(successResponse(null, 'Stock entry cancelled'));
  } catch (error) {
    next(error);
  }
};
