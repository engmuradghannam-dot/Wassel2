import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const customerSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(2),
  nameAr: z.string().optional(),
  searchTerm: z.string().optional(),
  title: z.string().optional(),
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
  taxClassification: z.enum(['STANDARD_RATED', 'ZERO_RATED', 'EXEMPT']).optional(),
  commercialReg: z.string().optional(),
  crExpiryDate: z.string().datetime().optional(),

  creditLimit: z.number().min(0).default(0),
  paymentTerms: z.number().int().min(0).default(30),
  currency: z.string().default('SAR'),
  paymentMethod: z.enum(['BANK_TRANSFER', 'CHEQUE', 'CASH', 'CARD']).optional(),
  riskCategory: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  dunningBlock: z.boolean().default(false),
  paymentBlock: z.boolean().default(false),
  reconciliationAccountId: z.string().optional(),

  salesPersonId: z.string().optional(),
  salesTerritory: z.string().optional(),
  shippingCondition: z.enum(['STANDARD', 'EXPRESS', 'FREIGHT_COLLECT']).optional(),
  deliveryPriority: z.number().int().min(1).max(10).default(5),
  incoterm: z.enum(['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP']).optional(),
  defaultPriceListId: z.string().optional(),
  completeDeliveryRequired: z.boolean().default(false),

  customerType: z.enum(['INDIVIDUAL', 'COMPANY', 'GOVERNMENT']).default('INDIVIDUAL'),
  customerGroup: z.string().optional(),
  customerClassification: z.enum(['A', 'B', 'C']).optional(),
  isBlacklisted: z.boolean().default(false),
});

function generateCode(prefix: string) {
  // Customer.code is globally unique (no per-company Counter table exists yet),
  // so combine a timestamp with a short random suffix to avoid collisions.
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}${rand}`;
}

// Cross-reference checks so a customer can't be linked to a sales rep,
// reconciliation account, or price list belonging to a different tenant (IDOR guard).
async function assertReferencesInCompany(companyId: string, data: {
  salesPersonId?: string; reconciliationAccountId?: string; defaultPriceListId?: string;
}) {
  if (data.salesPersonId) {
    const member = await prisma.companyMember.findUnique({
      where: { userId_companyId: { userId: data.salesPersonId, companyId } },
    });
    if (!member) throw new AppError('Sales person is not a member of this company', 400);
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

export const createCustomer = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = customerSchema.parse(req.body);
    const companyId = req.companyId!;

    if (!companyId) {
      throw new AppError('Company ID required', 400);
    }
    await assertReferencesInCompany(companyId, data);

    const customer = await prisma.customer.create({
      data: {
        ...data,
        email: data.email || undefined,
        code: data.code || generateCode('CUST'),
        companyId,
        createdById: req.user.userId,
      },
    });

    res.status(201).json(successResponse(customer, 'Customer created successfully'));
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return next(new AppError('Customer code already exists', 409));
    }
    next(error);
  }
};

export const getCustomers = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    if (!companyId) {
      throw new AppError('Company ID required', 400);
    }
    const search = (req.query.search as string) || '';

    const customers = await prisma.customer.findMany({
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

    res.json(successResponse(customers));
  } catch (error) {
    next(error);
  }
};

export const getCustomer = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const customer = await prisma.customer.findFirst({ where: { id, companyId } });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    res.json(successResponse(customer));
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const existing = await prisma.customer.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Customer not found', 404);

    const data = customerSchema.partial().parse(req.body);
    await assertReferencesInCompany(companyId, data);

    const customer = await prisma.customer.update({
      where: { id },
      data: { ...data, email: data.email || undefined },
    });

    res.json(successResponse(customer, 'Customer updated'));
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return next(new AppError('Customer code already exists', 409));
    }
    next(error);
  }
};

export const deleteCustomer = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const existing = await prisma.customer.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Customer not found', 404);

    await prisma.customer.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    res.json(successResponse(null, 'Customer deactivated'));
  } catch (error) {
    next(error);
  }
};
