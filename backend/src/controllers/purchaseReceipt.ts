import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const receiptSchema = z.object({
  receiptDate: z.string().datetime(),
  supplierId: z.string(),
  warehouseId: z.string(),
  purchaseOrderId: z.string().optional(),
  landedCost: z.number().min(0).optional(),
  items: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().positive(),
    unitCost: z.number().min(0),
  })).min(1),
  notes: z.string().optional(),
});

function generateReceiptNumber(sequence: number): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `PR-${year}${month}-${String(sequence).padStart(5, '0')}`;
}

export const createPurchaseReceipt = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = receiptSchema.parse(req.body);
    const companyId = req.companyId!;
    if (!companyId) throw new AppError('Company ID required', 400);

    const count = await prisma.purchaseReceipt.count({ where: { companyId } });
    const receiptNumber = generateReceiptNumber(count + 1);

    const receipt = await prisma.purchaseReceipt.create({
      data: {
        receiptNumber,
        receiptDate: new Date(data.receiptDate),
        supplierId: data.supplierId,
        warehouseId: data.warehouseId,
        purchaseOrderId: data.purchaseOrderId,
        landedCost: data.landedCost || 0,
        notes: data.notes,
        companyId,
        createdById: req.user.userId,
        items: { create: data.items },
      },
      include: { items: { include: { item: true } }, supplier: true, warehouse: true },
    });

    res.status(201).json(successResponse(receipt, 'Purchase receipt created'));
  } catch (error) {
    next(error);
  }
};

export const getPurchaseReceipts = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    if (!companyId) throw new AppError('Company ID required', 400);

    const receipts = await prisma.purchaseReceipt.findMany({
      where: { companyId },
      include: { supplier: { select: { name: true } }, warehouse: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(successResponse(receipts));
  } catch (error) {
    next(error);
  }
};

// Submitting a receipt moves stock in: increases BinCard + writes StockLedger,
// allocating any landed cost (freight/customs) proportionally across items by value.
export const submitPurchaseReceipt = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const receipt = await prisma.purchaseReceipt.findUnique({ where: { id }, include: { items: true } });
    if (!receipt) throw new AppError('Purchase receipt not found', 404);
    if (receipt.status !== 'DRAFT') throw new AppError('Only draft receipts can be submitted', 400);

    const totalValue = receipt.items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unitCost), 0);
    const landedCost = Number(receipt.landedCost);

    await prisma.$transaction(async (tx) => {
      for (const item of receipt.items) {
        const lineValue = Number(item.quantity) * Number(item.unitCost);
        const allocatedLandedCost = totalValue > 0 ? (lineValue / totalValue) * landedCost : 0;
        const effectiveCost = lineValue + allocatedLandedCost;

        const existingBin = await tx.binCard.findUnique({
          where: { itemId_warehouseId: { itemId: item.itemId, warehouseId: receipt.warehouseId } },
        });

        const newQty = (existingBin ? Number(existingBin.quantity) : 0) + Number(item.quantity);
        const newValue = (existingBin ? Number(existingBin.totalValue) : 0) + effectiveCost;
        const newAvgCost = newQty > 0 ? newValue / newQty : 0;

        await tx.binCard.upsert({
          where: { itemId_warehouseId: { itemId: item.itemId, warehouseId: receipt.warehouseId } },
          create: {
            itemId: item.itemId,
            warehouseId: receipt.warehouseId,
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
            entryDate: receipt.receiptDate,
            itemId: item.itemId,
            warehouseId: receipt.warehouseId,
            entryType: 'RECEIPT',
            quantity: item.quantity,
            unitCost: item.unitCost,
            totalCost: effectiveCost,
            balanceQty: newQty,
            balanceValue: newValue,
            reference: receipt.receiptNumber,
          },
        });
      }

      await tx.purchaseReceipt.update({ where: { id }, data: { status: 'SUBMITTED' } });
    });

    res.json(successResponse(null, 'Purchase receipt submitted and stock updated'));
  } catch (error) {
    next(error);
  }
};
