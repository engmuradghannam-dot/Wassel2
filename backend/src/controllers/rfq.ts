import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const rfqSchema = z.object({
  rfqDate: z.string().datetime(),
  supplierId: z.string(),
  notes: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().positive(),
    description: z.string().optional(),
  })).min(1),
});

function generateNumber(prefix: string, sequence: number): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${prefix}-${year}${month}-${String(sequence).padStart(5, '0')}`;
}

export const createRfq = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = rfqSchema.parse(req.body);
    const companyId = req.companyId!;

    const count = await prisma.requestForQuotation.count({ where: { companyId } });
    const rfqNumber = generateNumber('RFQ', count + 1);

    const rfq = await prisma.requestForQuotation.create({
      data: {
        rfqNumber,
        rfqDate: new Date(data.rfqDate),
        supplierId: data.supplierId,
        notes: data.notes,
        companyId,
        createdById: req.user.userId,
        items: { create: data.items },
      },
      include: { items: { include: { item: true } }, supplier: true },
    });

    res.status(201).json(successResponse(rfq, 'RFQ created'));
  } catch (error) {
    next(error);
  }
};

export const getRfqs = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;

    const rfqs = await prisma.requestForQuotation.findMany({
      where: { companyId },
      include: { supplier: { select: { name: true } }, _count: { select: { items: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(successResponse(rfqs));
  } catch (error) {
    next(error);
  }
};

export const getRfq = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { id } = req.params;

    const rfq = await prisma.requestForQuotation.findFirst({
      where: { id, companyId },
      include: { items: { include: { item: true } }, supplier: true },
    });
    if (!rfq) throw new AppError('RFQ not found', 404);

    res.json(successResponse(rfq));
  } catch (error) {
    next(error);
  }
};

export const updateRfqStatus = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { id } = req.params;
    const { status } = z.object({ status: z.enum(['DRAFT', 'SENT', 'RECEIVED', 'CLOSED']) }).parse(req.body);

    const existing = await prisma.requestForQuotation.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('RFQ not found', 404);

    const rfq = await prisma.requestForQuotation.update({ where: { id }, data: { status } });
    res.json(successResponse(rfq, 'RFQ status updated'));
  } catch (error) {
    next(error);
  }
};
