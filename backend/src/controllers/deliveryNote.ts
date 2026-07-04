import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const deliveryNoteSchema = z.object({
  deliveryDate: z.string().datetime(),
  customerId: z.string(),
  warehouseId: z.string(),
  salesOrderId: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().positive(),
  })).min(1),
});

function generateNumber(prefix: string, sequence: number): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${prefix}-${year}${month}-${String(sequence).padStart(5, '0')}`;
}

export const createDeliveryNote = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = deliveryNoteSchema.parse(req.body);
    const companyId = req.companyId!;

    const warehouse = await prisma.warehouse.findUnique({ where: { id: data.warehouseId } });
    if (!warehouse || warehouse.companyId !== companyId) {
      throw new AppError('Warehouse not found in this company', 404);
    }

    const count = await prisma.deliveryNote.count({ where: { companyId } });
    const deliveryNumber = generateNumber('DN', count + 1);

    const note = await prisma.deliveryNote.create({
      data: {
        deliveryNumber,
        deliveryDate: new Date(data.deliveryDate),
        customerId: data.customerId,
        warehouseId: data.warehouseId,
        salesOrderId: data.salesOrderId,
        notes: data.notes,
        companyId,
        createdById: req.user.userId,
        items: { create: data.items },
      },
      include: { items: { include: { item: true } }, customer: true, warehouse: true },
    });

    res.status(201).json(successResponse(note, 'Delivery note created'));
  } catch (error) {
    next(error);
  }
};

export const getDeliveryNotes = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;

    const notes = await prisma.deliveryNote.findMany({
      where: { companyId },
      include: { customer: { select: { name: true } }, _count: { select: { items: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(successResponse(notes));
  } catch (error) {
    next(error);
  }
};

export const getDeliveryNote = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { id } = req.params;

    const note = await prisma.deliveryNote.findFirst({
      where: { id, companyId },
      include: { items: { include: { item: true } }, customer: true, warehouse: true },
    });
    if (!note) throw new AppError('Delivery note not found', 404);

    res.json(successResponse(note));
  } catch (error) {
    next(error);
  }
};

export const submitDeliveryNote = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { id } = req.params;

    const note = await prisma.deliveryNote.findFirst({ where: { id, companyId }, include: { items: true } });
    if (!note) throw new AppError('Delivery note not found', 404);
    if (note.status !== 'DRAFT') throw new AppError('Only draft delivery notes can be submitted', 400);

    const warehouse = await prisma.warehouse.findUnique({ where: { id: note.warehouseId } });
    if (!warehouse) throw new AppError('Warehouse not found', 404);

    // Submitting a delivery note actually moves stock out of the warehouse —
    // mirrors the same BinCard + StockLedger bookkeeping used by stock entries.
    await prisma.$transaction(async (tx) => {
      for (const line of note.items) {
        const item = await tx.item.findUnique({ where: { id: line.itemId } });
        if (!item) throw new AppError(`Item not found: ${line.itemId}`, 404);

        const existingBin = await tx.binCard.findUnique({
          where: { itemId_warehouseId: { itemId: line.itemId, warehouseId: note.warehouseId } },
        });

        const qty = Number(line.quantity);
        const newQty = (existingBin ? Number(existingBin.quantity) : 0) - qty;

        if (newQty < 0 && !warehouse.allowNegative) {
          throw new AppError(`Insufficient stock for item ${item.name} in this warehouse`, 400);
        }

        const unitCost = existingBin ? Number(existingBin.avgCost) : Number(item.standardCost);
        const totalCost = unitCost * qty;
        const prevValue = existingBin ? Number(existingBin.totalValue) : 0;
        const newValue = Math.max(prevValue - totalCost, 0);
        const newAvgCost = newQty > 0 ? newValue / newQty : 0;

        await tx.binCard.upsert({
          where: { itemId_warehouseId: { itemId: line.itemId, warehouseId: note.warehouseId } },
          create: {
            itemId: line.itemId, warehouseId: note.warehouseId,
            quantity: newQty, availableQty: newQty, avgCost: newAvgCost, totalValue: newValue,
          },
          update: {
            quantity: newQty, availableQty: newQty, avgCost: newAvgCost, totalValue: newValue,
            lastMovement: new Date(),
          },
        });

        await tx.stockLedger.create({
          data: {
            entryDate: note.deliveryDate,
            itemId: line.itemId,
            warehouseId: note.warehouseId,
            entryType: 'ISSUE',
            quantity: qty,
            unitCost,
            totalCost,
            balanceQty: newQty,
            balanceValue: newValue,
            reference: note.deliveryNumber,
          },
        });
      }

      await tx.deliveryNote.update({ where: { id }, data: { status: 'SUBMITTED' } });
    });

    res.json(successResponse(null, 'Delivery note submitted'));
  } catch (error) {
    next(error);
  }
};

export const cancelDeliveryNote = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { id } = req.params;

    const existing = await prisma.deliveryNote.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Delivery note not found', 404);

    const note = await prisma.deliveryNote.update({ where: { id }, data: { status: 'CANCELLED' } });
    res.json(successResponse(note, 'Delivery note cancelled'));
  } catch (error) {
    next(error);
  }
};
