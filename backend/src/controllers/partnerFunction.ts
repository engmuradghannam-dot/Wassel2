import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const partnerFunctionSchema = z.object({
  type: z.enum(['SOLD_TO', 'BILL_TO', 'SHIP_TO', 'PAYER', 'ORDERING_ADDRESS', 'INVOICE_FROM', 'REMIT_TO']),
  name: z.string().min(1),
  attentionOf: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('SA'),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  isDefault: z.boolean().default(false),
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
});

async function assertPartyInCompany(companyId: string, customerId?: string, supplierId?: string) {
  if (!customerId && !supplierId) {
    throw new AppError('Either customerId or supplierId is required', 400);
  }
  if (customerId) {
    const customer = await prisma.customer.findFirst({ where: { id: customerId, companyId } });
    if (!customer) throw new AppError('Customer not found', 404);
  }
  if (supplierId) {
    const supplier = await prisma.supplier.findFirst({ where: { id: supplierId, companyId } });
    if (!supplier) throw new AppError('Supplier not found', 404);
  }
}

export const createPartnerFunction = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = partnerFunctionSchema.parse(req.body);
    const companyId = req.companyId!;
    await assertPartyInCompany(companyId, data.customerId, data.supplierId);

    if (data.isDefault) {
      await prisma.partnerFunction.updateMany({
        where: {
          companyId,
          type: data.type,
          customerId: data.customerId ?? null,
          supplierId: data.supplierId ?? null,
        },
        data: { isDefault: false },
      });
    }

    const partnerFunction = await prisma.partnerFunction.create({
      data: { ...data, companyId },
    });

    res.status(201).json(successResponse(partnerFunction, 'Partner function created'));
  } catch (error) {
    next(error);
  }
};

export const getPartnerFunctions = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { customerId, supplierId, type } = req.query;

    const where: any = { companyId };
    if (customerId) where.customerId = customerId as string;
    if (supplierId) where.supplierId = supplierId as string;
    if (type) where.type = type as string;

    const partnerFunctions = await prisma.partnerFunction.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(successResponse(partnerFunctions));
  } catch (error) {
    next(error);
  }
};

export const getPartnerFunction = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const partnerFunction = await prisma.partnerFunction.findFirst({ where: { id, companyId } });
    if (!partnerFunction) throw new AppError('Partner function not found', 404);
    res.json(successResponse(partnerFunction));
  } catch (error) {
    next(error);
  }
};

export const updatePartnerFunction = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const existing = await prisma.partnerFunction.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Partner function not found', 404);

    const data = partnerFunctionSchema.partial().parse(req.body);

    if (data.isDefault) {
      await prisma.partnerFunction.updateMany({
        where: {
          companyId,
          type: data.type ?? existing.type,
          customerId: existing.customerId,
          supplierId: existing.supplierId,
          NOT: { id },
        },
        data: { isDefault: false },
      });
    }

    const partnerFunction = await prisma.partnerFunction.update({ where: { id }, data });
    res.json(successResponse(partnerFunction, 'Partner function updated'));
  } catch (error) {
    next(error);
  }
};

export const deletePartnerFunction = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const existing = await prisma.partnerFunction.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Partner function not found', 404);

    await prisma.partnerFunction.delete({ where: { id } });
    res.json(successResponse(null, 'Partner function deleted'));
  } catch (error) {
    next(error);
  }
};
