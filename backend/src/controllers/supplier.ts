import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const supplierSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(2),
  nameAr: z.string().optional(),
  searchTerm: z.string().optional(),
  legalForm: z.string().optional(),
  industry: z.string().optional(),
  language: z.string().default('ar'),

  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  fax: z.string().optional(),
  website: z.string().optional(),

  address: z.string().optional(),
  buildingNumber: z.string().optional(),
  street: z.string().optional(),
  district: z.string().optional(),
  additionalNumber: z.string().optional(),
  poBox: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  region: z.string().optional(),
  country: z.string().default('SA'),
  zipCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),

  taxId: z.string().optional(),
  vatRegistrationDate: z.string().datetime().optional(),
  withholdingTaxApplicable: z.boolean().default(false),
  withholdingTaxRate: z.number().min(0).max(100).optional(),
  commercialReg: z.string().optional(),
  crExpiryDate: z.string().datetime().optional(),

  creditLimit: z.number().min(0).default(0),
  paymentTerms: z.number().int().min(0).default(30),
  currency: z.string().default('SAR'),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CHEQUE', 'CASH', 'CARD']).optional(),
  reconciliationAccountId: z.string().optional(),
  paymentBlock: z.boolean().default(false),

  buyerId: z.string().optional(),
  minimumOrderValue: z.number().min(0).optional(),
  leadTimeDays: z.number().int().min(0).optional(),
  incoterm: z.enum(['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP']).optional(),
  defaultPriceListId: z.string().optional(),
  qualityRating: z.number().min(0).max(5).optional(),
  deliveryRating: z.number().min(0).max(5).optional(),
  priceRating: z.number().min(0).max(5).optional(),
  isApprovedVendor: z.boolean().default(true),
  vendorClassification: z.enum(['A', 'B', 'C']).optional(),

  supplierType: z.enum(['COMPANY', 'INDIVIDUAL', 'IMPORTER']).default('COMPANY'),
  supplierGroup: z.string().optional(),
  isBlacklisted: z.boolean().default(false),
});

function generateCode(prefix: string) {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}${rand}`;
}

// Cross-reference checks so a supplier can't be linked to a buyer, reconciliation
// account, or price list belonging to a different tenant (IDOR guard).
async function assertReferencesInCompany(companyId: string, data: {
  buyerId?: string; reconciliationAccountId?: string; defaultPriceListId?: string;
}) {
  if (data.buyerId) {
    const member = await prisma.companyMember.findUnique({
      where: { userId_companyId: { userId: data.buyerId, companyId } },
    });
    if (!member) throw new AppError('Buyer is not a member of this company', 400);
  }
  if (data.reconciliationAccountId) {
    const account = await prisma.account.findFirst({ where: { id: data.reconciliationAccountId, companyId } });
    if (!account) throw new AppError('Reconciliation account not found', 404);
  }
  if (data.defaultPriceListId) {
    const priceList = await prisma.priceList.findFirst({ where: { id: data.defaultPriceListId, companyId } });
    if (!priceList) throw new AppError('Default price list not found', 404);
  }
}

export const createSupplier = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = supplierSchema.parse(req.body);
    const companyId = req.companyId!;

    if (!companyId) {
      throw new AppError('Company ID required', 400);
    }
    await assertReferencesInCompany(companyId, data);

    const supplier = await prisma.supplier.create({
      data: {
        ...data,
        email: data.email || undefined,
        code: data.code || generateCode('SUPP'),
        companyId,
        createdById: req.user.userId,
      },
    });

    res.status(201).json(successResponse(supplier, 'Supplier created successfully'));
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return next(new AppError('Supplier code already exists', 409));
    }
    next(error);
  }
};

export const getSuppliers = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    if (!companyId) {
      throw new AppError('Company ID required', 400);
    }
    const search = (req.query.search as string) || '';

    const suppliers = await prisma.supplier.findMany({
      where: {
        companyId,
        status: 'ACTIVE',
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(successResponse(suppliers));
  } catch (error) {
    next(error);
  }
};

export const getSupplier = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const supplier = await prisma.supplier.findFirst({ where: { id, companyId } });

    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }

    res.json(successResponse(supplier));
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const existing = await prisma.supplier.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Supplier not found', 404);

    const data = supplierSchema.partial().parse(req.body);
    await assertReferencesInCompany(companyId, data);

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { ...data, email: data.email || undefined },
    });

    res.json(successResponse(supplier, 'Supplier updated'));
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return next(new AppError('Supplier code already exists', 409));
    }
    next(error);
  }
};

export const deleteSupplier = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const existing = await prisma.supplier.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Supplier not found', 404);

    await prisma.supplier.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    res.json(successResponse(null, 'Supplier deactivated'));
  } catch (error) {
    next(error);
  }
};
