import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

function generateNumber(prefix: string, sequence: number): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${prefix}-${year}${month}-${String(sequence).padStart(5, '0')}`;
}

// ---------------- Production Plan ----------------

const productionPlanSchema = z.object({
  postingDate: z.string().datetime(),
  items: z.array(z.object({
    itemId: z.string(),
    plannedQty: z.number().positive(),
  })).min(1),
});

export const createProductionPlan = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = productionPlanSchema.parse(req.body);
    const companyId = req.companyId!;

    const count = await prisma.productionPlan.count({ where: { companyId } });
    const planNumber = generateNumber('PP', count + 1);
    const totalPlannedQty = data.items.reduce((sum, i) => sum + i.plannedQty, 0);

    const plan = await prisma.productionPlan.create({
      data: {
        planNumber,
        postingDate: new Date(data.postingDate),
        totalPlannedQty,
        companyId,
        items: {
          create: data.items.map((i) => ({
            itemId: i.itemId,
            plannedQty: i.plannedQty,
            pendingQty: i.plannedQty,
          })),
        },
      },
      include: { items: true },
    });

    res.status(201).json(successResponse(plan, 'Production plan created'));
  } catch (error) {
    next(error);
  }
};

export const getProductionPlans = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const plans = await prisma.productionPlan.findMany({
      where: { companyId },
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(successResponse(plans));
  } catch (error) {
    next(error);
  }
};

export const getProductionPlan = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { id } = req.params;
    const plan = await prisma.productionPlan.findFirst({
      where: { id, companyId },
      include: { items: true },
    });
    if (!plan) throw new AppError('Production plan not found', 404);
    res.json(successResponse(plan));
  } catch (error) {
    next(error);
  }
};

export const updateProductionPlanStatus = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { id } = req.params;
    const { status } = z.object({
      status: z.enum(['DRAFT', 'SUBMITTED', 'IN_PROCESS', 'COMPLETED', 'CANCELLED']),
    }).parse(req.body);

    const existing = await prisma.productionPlan.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Production plan not found', 404);

    const plan = await prisma.productionPlan.update({ where: { id }, data: { status } });
    res.json(successResponse(plan, 'Production plan status updated'));
  } catch (error) {
    next(error);
  }
};

// ---------------- Subcontracting Order ----------------

const subcontractingOrderSchema = z.object({
  supplierId: z.string(),
  items: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().positive(),
  })).min(1),
});

export const createSubcontractingOrder = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = subcontractingOrderSchema.parse(req.body);
    const companyId = req.companyId!;

    const supplier = await prisma.supplier.findUnique({ where: { id: data.supplierId } });
    if (!supplier || supplier.companyId !== companyId) throw new AppError('Supplier not found in this company', 404);

    const count = await prisma.subcontractingOrder.count({ where: { companyId } });
    const orderNumber = generateNumber('SC', count + 1);

    const order = await prisma.subcontractingOrder.create({
      data: {
        orderNumber,
        supplierId: data.supplierId,
        companyId,
        items: { create: data.items },
      },
      include: { items: true },
    });

    res.status(201).json(successResponse(order, 'Subcontracting order created'));
  } catch (error) {
    next(error);
  }
};

export const getSubcontractingOrders = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const orders = await prisma.subcontractingOrder.findMany({
      where: { companyId },
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(successResponse(orders));
  } catch (error) {
    next(error);
  }
};

export const getSubcontractingOrder = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { id } = req.params;
    const order = await prisma.subcontractingOrder.findFirst({
      where: { id, companyId },
      include: { items: true },
    });
    if (!order) throw new AppError('Subcontracting order not found', 404);
    res.json(successResponse(order));
  } catch (error) {
    next(error);
  }
};

export const updateSubcontractingOrderStatus = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { id } = req.params;
    const { status } = z.object({
      status: z.enum(['DRAFT', 'SUBMITTED', 'IN_PROCESS', 'COMPLETED', 'CANCELLED']),
    }).parse(req.body);

    const existing = await prisma.subcontractingOrder.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Subcontracting order not found', 404);

    const order = await prisma.subcontractingOrder.update({ where: { id }, data: { status } });
    res.json(successResponse(order, 'Subcontracting order status updated'));
  } catch (error) {
    next(error);
  }
};

// ---------------- Quality Inspection ----------------

const qualityInspectionSchema = z.object({
  itemId: z.string(),
  inspectionType: z.string(),
  referenceType: z.string(),
  referenceName: z.string().optional(),
  sampleSize: z.number().positive().default(1),
  inspectedBy: z.string().optional(),
  readings: z.array(z.object({
    specification: z.string().optional(),
    value: z.string().optional(),
    status: z.enum(['Accepted', 'Rejected']).default('Accepted'),
  })).optional(),
});

export const createQualityInspection = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = qualityInspectionSchema.parse(req.body);
    const companyId = req.companyId!;

    const item = await prisma.item.findUnique({ where: { id: data.itemId } });
    if (!item || item.companyId !== companyId) throw new AppError('Item not found in this company', 404);

    const count = await prisma.qualityInspection.count({ where: { companyId } });
    const qiNumber = generateNumber('QI', count + 1);

    const inspection = await prisma.qualityInspection.create({
      data: {
        qiNumber,
        itemId: data.itemId,
        inspectionType: data.inspectionType,
        referenceType: data.referenceType,
        referenceName: data.referenceName,
        sampleSize: data.sampleSize,
        inspectedBy: data.inspectedBy,
        companyId,
        createdById: req.user.userId,
        readings: data.readings ? { create: data.readings } : undefined,
      },
      include: { readings: true, item: true },
    });

    res.status(201).json(successResponse(inspection, 'Quality inspection created'));
  } catch (error) {
    next(error);
  }
};

export const getQualityInspections = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const inspections = await prisma.qualityInspection.findMany({
      where: { companyId },
      include: { item: { select: { name: true } }, _count: { select: { readings: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(successResponse(inspections));
  } catch (error) {
    next(error);
  }
};

export const updateQualityInspectionStatus = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { id } = req.params;
    const { status } = z.object({ status: z.enum(['DRAFT', 'SUBMITTED', 'ACCEPTED', 'REJECTED']) }).parse(req.body);

    const existing = await prisma.qualityInspection.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Quality inspection not found', 404);

    const inspection = await prisma.qualityInspection.update({ where: { id }, data: { status } });
    res.json(successResponse(inspection, 'Quality inspection status updated'));
  } catch (error) {
    next(error);
  }
};

// ---------------- Quality Goal ----------------

const qualityGoalSchema = z.object({
  goalName: z.string().min(2),
  objective: z.string().optional(),
});

export const createQualityGoal = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = qualityGoalSchema.parse(req.body);
    const companyId = req.companyId!;

    const goal = await prisma.qualityGoal.create({ data: { ...data, companyId } });
    res.status(201).json(successResponse(goal, 'Quality goal created'));
  } catch (error) {
    next(error);
  }
};

export const getQualityGoals = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const goals = await prisma.qualityGoal.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } });
    res.json(successResponse(goals));
  } catch (error) {
    next(error);
  }
};
