import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

function generateCode(prefix: string) {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}${rand}`;
}

// ==================== BOM ====================

const bomSchema = z.object({
  bomNumber: z.string().optional(),
  itemId: z.string(),
  quantity: z.number().positive().default(1),
  isDefault: z.boolean().default(false),
  rawMaterials: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().positive(),
    rate: z.number().min(0),
  })).min(1),
});

export const createBOM = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = bomSchema.parse(req.body);
    const companyId = req.body?.companyId || req.query.companyId || req.user?.companyId;
    if (!companyId) throw new AppError('Company ID required', 400);

    const rawMaterials = data.rawMaterials.map((rm) => ({
      itemId: rm.itemId,
      quantity: rm.quantity,
      rate: rm.rate,
      amount: rm.quantity * rm.rate,
    }));

    const bom = await prisma.bOM.create({
      data: {
        bomNumber: data.bomNumber || generateCode('BOM'),
        itemId: data.itemId,
        quantity: data.quantity,
        isDefault: data.isDefault,
        companyId,
        createdById: req.user.userId,
        rawMaterials: { create: rawMaterials },
      },
      include: { rawMaterials: { include: { item: true } }, item: true },
    });

    res.status(201).json(successResponse(bom, 'BOM created'));
  } catch (error) {
    next(error);
  }
};

export const getBOMs = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.body?.companyId || req.query.companyId || req.user?.companyId;
    if (!companyId) throw new AppError('Company ID required', 400);

    const boms = await prisma.bOM.findMany({
      where: { companyId, isActive: true },
      include: { item: { select: { name: true, code: true } }, rawMaterials: { include: { item: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(successResponse(boms));
  } catch (error) {
    next(error);
  }
};

// ==================== Work Orders ====================

const workOrderSchema = z.object({
  workOrderNumber: z.string().optional(),
  bomId: z.string(),
  quantity: z.number().positive(),
  plannedStartDate: z.string().datetime(),
  plannedEndDate: z.string().datetime(),
  warehouseId: z.string(),
  fgWarehouseId: z.string(),
  description: z.string().optional(),
});

export const createWorkOrder = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = workOrderSchema.parse(req.body);
    const companyId = req.body?.companyId || req.query.companyId || req.user?.companyId;
    if (!companyId) throw new AppError('Company ID required', 400);

    const workOrder = await prisma.workOrder.create({
      data: {
        workOrderNumber: data.workOrderNumber || generateCode('WO'),
        bomId: data.bomId,
        quantity: data.quantity,
        plannedStartDate: new Date(data.plannedStartDate),
        plannedEndDate: new Date(data.plannedEndDate),
        warehouseId: data.warehouseId,
        fgWarehouseId: data.fgWarehouseId,
        description: data.description,
        companyId,
        createdById: req.user.userId,
      },
      include: { bom: { include: { item: true, rawMaterials: { include: { item: true } } } } },
    });

    res.status(201).json(successResponse(workOrder, 'Work order created'));
  } catch (error) {
    next(error);
  }
};

export const getWorkOrders = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.body?.companyId || req.query.companyId || req.user?.companyId;
    if (!companyId) throw new AppError('Company ID required', 400);

    const workOrders = await prisma.workOrder.findMany({
      where: { companyId },
      include: {
        bom: { include: { item: { select: { name: true } } } },
        _count: { select: { jobCards: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(successResponse(workOrders));
  } catch (error) {
    next(error);
  }
};

// Completing a work order: consumes raw materials from the source warehouse
// and produces the finished item into the finished-goods warehouse, both via
// real BinCard/StockLedger movements in one transaction (same mechanics as
// stock entries / purchase receipts elsewhere in the app).
export const completeWorkOrder = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: { bom: { include: { rawMaterials: true, item: true } } },
    });
    if (!workOrder) throw new AppError('Work order not found', 404);
    if (workOrder.status === 'COMPLETED') throw new AppError('Work order already completed', 400);

    const qtyMultiplier = Number(workOrder.quantity) / Number(workOrder.bom.quantity);

    await prisma.$transaction(async (tx) => {
      // Consume raw materials from source warehouse
      for (const rm of workOrder.bom.rawMaterials) {
        const requiredQty = Number(rm.quantity) * qtyMultiplier;
        const bin = await tx.binCard.findUnique({
          where: { itemId_warehouseId: { itemId: rm.itemId, warehouseId: workOrder.warehouseId } },
        });
        const available = bin ? Number(bin.availableQty) : 0;
        if (available < requiredQty) {
          throw new AppError(`Insufficient stock for raw material to complete this work order`, 400);
        }
        const newQty = available - requiredQty;
        const consumedValue = Number(rm.rate) * requiredQty;
        const newValue = Math.max((bin ? Number(bin.totalValue) : 0) - consumedValue, 0);

        await tx.binCard.update({
          where: { itemId_warehouseId: { itemId: rm.itemId, warehouseId: workOrder.warehouseId } },
          data: { quantity: newQty, availableQty: newQty, totalValue: newValue, lastMovement: new Date() },
        });

        await tx.stockLedger.create({
          data: {
            entryDate: new Date(),
            itemId: rm.itemId,
            warehouseId: workOrder.warehouseId,
            entryType: 'MANUFACTURE',
            quantity: requiredQty,
            unitCost: rm.rate,
            totalCost: consumedValue,
            balanceQty: newQty,
            balanceValue: newValue,
            reference: workOrder.workOrderNumber,
          },
        });
      }

      // Produce finished item into finished-goods warehouse
      const producedQty = Number(workOrder.quantity);
      const producedValue = workOrder.bom.rawMaterials.reduce(
        (sum, rm) => sum + Number(rm.rate) * Number(rm.quantity) * qtyMultiplier,
        0
      );
      const fgBin = await tx.binCard.findUnique({
        where: { itemId_warehouseId: { itemId: workOrder.bom.itemId, warehouseId: workOrder.fgWarehouseId } },
      });
      const newFgQty = (fgBin ? Number(fgBin.quantity) : 0) + producedQty;
      const newFgValue = (fgBin ? Number(fgBin.totalValue) : 0) + producedValue;

      await tx.binCard.upsert({
        where: { itemId_warehouseId: { itemId: workOrder.bom.itemId, warehouseId: workOrder.fgWarehouseId } },
        create: {
          itemId: workOrder.bom.itemId, warehouseId: workOrder.fgWarehouseId,
          quantity: newFgQty, availableQty: newFgQty,
          avgCost: newFgQty > 0 ? newFgValue / newFgQty : 0, totalValue: newFgValue,
        },
        update: {
          quantity: newFgQty, availableQty: newFgQty,
          avgCost: newFgQty > 0 ? newFgValue / newFgQty : 0, totalValue: newFgValue,
          lastMovement: new Date(),
        },
      });

      await tx.stockLedger.create({
        data: {
          entryDate: new Date(),
          itemId: workOrder.bom.itemId,
          warehouseId: workOrder.fgWarehouseId,
          entryType: 'MANUFACTURE',
          quantity: producedQty,
          unitCost: producedQty > 0 ? producedValue / producedQty : 0,
          totalCost: producedValue,
          balanceQty: newFgQty,
          balanceValue: newFgValue,
          reference: workOrder.workOrderNumber,
        },
      });

      await tx.workOrder.update({
        where: { id },
        data: { status: 'COMPLETED', producedQuantity: producedQty, actualEndDate: new Date() },
      });
    });

    res.json(successResponse(null, 'Work order completed - stock consumed and produced'));
  } catch (error) {
    next(error);
  }
};

// ==================== Job Cards ====================

const jobCardSchema = z.object({
  jobCardNumber: z.string().optional(),
  workOrderId: z.string(),
  operation: z.string().optional(),
  workstation: z.string().optional(),
  plannedStartTime: z.string().datetime().optional(),
  plannedEndTime: z.string().datetime().optional(),
});

export const createJobCard = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = jobCardSchema.parse(req.body);

    const jobCard = await prisma.jobCard.create({
      data: {
        ...data,
        jobCardNumber: data.jobCardNumber || generateCode('JC'),
        plannedStartTime: data.plannedStartTime ? new Date(data.plannedStartTime) : undefined,
        plannedEndTime: data.plannedEndTime ? new Date(data.plannedEndTime) : undefined,
      },
    });

    res.status(201).json(successResponse(jobCard, 'Job card created'));
  } catch (error) {
    next(error);
  }
};

export const getJobCards = async (req: any, res: Response, next: NextFunction) => {
  try {
    const workOrderId = req.query.workOrderId as string | undefined;
    const jobCards = await prisma.jobCard.findMany({
      where: workOrderId ? { workOrderId } : undefined,
      include: { workOrder: { select: { workOrderNumber: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(successResponse(jobCards));
  } catch (error) {
    next(error);
  }
};

export const updateJobCardStatus = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = z.object({ status: z.enum(['PENDING', 'WORK_IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED']) }).parse(req.body);
    const jobCard = await prisma.jobCard.update({
      where: { id },
      data: {
        status,
        actualStartTime: status === 'WORK_IN_PROGRESS' ? new Date() : undefined,
        actualEndTime: status === 'COMPLETED' ? new Date() : undefined,
      },
    });
    res.json(successResponse(jobCard, 'Job card updated'));
  } catch (error) {
    next(error);
  }
};
