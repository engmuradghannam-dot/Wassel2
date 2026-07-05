import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const costCenterSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  nameAr: z.string().optional(),
  isGroup: z.boolean().default(false),
  parentId: z.string().optional(),
});

export const createCostCenter = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = costCenterSchema.parse(req.body);
    const companyId = req.companyId!;

    if (data.parentId) {
      const parent = await prisma.costCenter.findFirst({ where: { id: data.parentId, companyId } });
      if (!parent) throw new AppError('Parent cost center not found', 404);
    }

    const costCenter = await prisma.costCenter.create({ data: { ...data, companyId } });
    res.status(201).json(successResponse(costCenter, 'Cost center created'));
  } catch (error) {
    next(error);
  }
};

export const getCostCenters = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const costCenters = await prisma.costCenter.findMany({
      where: { companyId },
      include: { children: true, _count: { select: { journalEntryLines: true } } },
      orderBy: { code: 'asc' },
    });
    res.json(successResponse(costCenters));
  } catch (error) {
    next(error);
  }
};

export const getCostCenter = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const costCenter = await prisma.costCenter.findFirst({
      where: { id, companyId },
      include: { children: true, parent: true },
    });
    if (!costCenter) throw new AppError('Cost center not found', 404);
    res.json(successResponse(costCenter));
  } catch (error) {
    next(error);
  }
};

// Aggregates posted journal entry line amounts booked against this cost
// center (and, if it's a group, against all its descendants) for
// cost-center-wise expense reporting.
export const getCostCenterReport = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const costCenter = await prisma.costCenter.findFirst({ where: { id, companyId }, include: { children: true } });
    if (!costCenter) throw new AppError('Cost center not found', 404);

    const costCenterIds = [id, ...costCenter.children.map((c) => c.id)];

    const lines = await prisma.journalEntryLine.findMany({
      where: {
        costCenterId: { in: costCenterIds },
        journalEntry: { companyId, status: 'POSTED' },
      },
      include: { debitAccount: true, creditAccount: true, journalEntry: { select: { entryDate: true } } },
    });

    const totalAmount = lines.reduce((sum, l) => sum + Number(l.amount), 0);

    res.json(successResponse({
      costCenter: { id: costCenter.id, code: costCenter.code, name: costCenter.name },
      totalAmount,
      entryCount: lines.length,
      lines,
    }));
  } catch (error) {
    next(error);
  }
};

export const updateCostCenter = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const existing = await prisma.costCenter.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Cost center not found', 404);

    const data = costCenterSchema.partial().parse(req.body);
    const costCenter = await prisma.costCenter.update({ where: { id }, data });
    res.json(successResponse(costCenter, 'Cost center updated'));
  } catch (error) {
    next(error);
  }
};

export const deleteCostCenter = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const existing = await prisma.costCenter.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Cost center not found', 404);

    await prisma.costCenter.delete({ where: { id } });
    res.json(successResponse(null, 'Cost center deleted'));
  } catch (error) {
    next(error);
  }
};
