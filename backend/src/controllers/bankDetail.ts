import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const bankDetailSchema = z.object({
  accountName: z.string().min(1),
  accountNumber: z.string().optional(),
  iban: z.string().regex(/^[A-Z]{2}[0-9A-Z]{13,32}$/, 'Invalid IBAN format').optional().or(z.literal('')),
  swiftCode: z.string().regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'Invalid SWIFT/BIC format').optional().or(z.literal('')),
  bankName: z.string().min(1),
  branchName: z.string().optional(),
  currency: z.string().default('SAR'),
  isPrimary: z.boolean().default(false),
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
  isOwnCompanyAccount: z.boolean().default(false), // true = one of OUR company's own bank accounts
});

async function assertPartyInCompany(companyId: string, customerId?: string, supplierId?: string, isOwnCompanyAccount?: boolean) {
  if (isOwnCompanyAccount) return;
  if (!customerId && !supplierId) {
    throw new AppError('Either customerId, supplierId, or isOwnCompanyAccount is required', 400);
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

export const createBankDetail = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = bankDetailSchema.parse(req.body);
    const companyId = req.companyId!;
    await assertPartyInCompany(companyId, data.customerId, data.supplierId, data.isOwnCompanyAccount);

    const { isOwnCompanyAccount, ...rest } = data;

    // If marking as primary, unset any other primary bank detail for the same party first.
    if (rest.isPrimary) {
      await prisma.bankDetail.updateMany({
        where: {
          companyId,
          customerId: rest.customerId ?? null,
          supplierId: rest.supplierId ?? null,
          ownCompanyBankOf: isOwnCompanyAccount ? companyId : null,
        },
        data: { isPrimary: false },
      });
    }

    const bankDetail = await prisma.bankDetail.create({
      data: {
        ...rest,
        companyId,
        ownCompanyBankOf: isOwnCompanyAccount ? companyId : null,
      },
    });

    res.status(201).json(successResponse(bankDetail, 'Bank detail created'));
  } catch (error) {
    next(error);
  }
};

export const getBankDetails = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { customerId, supplierId, ownCompany } = req.query;

    const where: any = { companyId };
    if (customerId) where.customerId = customerId as string;
    if (supplierId) where.supplierId = supplierId as string;
    if (ownCompany === 'true') where.ownCompanyBankOf = companyId;

    const bankDetails = await prisma.bankDetail.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(successResponse(bankDetails));
  } catch (error) {
    next(error);
  }
};

export const getBankDetail = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const bankDetail = await prisma.bankDetail.findFirst({ where: { id, companyId } });
    if (!bankDetail) throw new AppError('Bank detail not found', 404);
    res.json(successResponse(bankDetail));
  } catch (error) {
    next(error);
  }
};

export const updateBankDetail = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const existing = await prisma.bankDetail.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Bank detail not found', 404);

    const data = bankDetailSchema.partial().parse(req.body);
    const { isOwnCompanyAccount: _isOwnCompanyAccount, ...rest } = data;

    if (rest.isPrimary) {
      await prisma.bankDetail.updateMany({
        where: {
          companyId,
          customerId: existing.customerId,
          supplierId: existing.supplierId,
          ownCompanyBankOf: existing.ownCompanyBankOf,
          NOT: { id },
        },
        data: { isPrimary: false },
      });
    }

    const bankDetail = await prisma.bankDetail.update({ where: { id }, data: rest });
    res.json(successResponse(bankDetail, 'Bank detail updated'));
  } catch (error) {
    next(error);
  }
};

export const deleteBankDetail = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const existing = await prisma.bankDetail.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Bank detail not found', 404);

    await prisma.bankDetail.delete({ where: { id } });
    res.json(successResponse(null, 'Bank detail deleted'));
  } catch (error) {
    next(error);
  }
};
