import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const companySchema = z.object({
  name: z.string().min(2),
  nameAr: z.string().optional(),
  legalName: z.string().optional(),
  taxId: z.string().optional(),
  commercialReg: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('SA'),
  zipCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  currency: z.string().default('SAR'),
  fiscalYearStart: z.number().min(1).max(12).default(1),
  fiscalYearEnd: z.number().min(1).max(12).default(12),
});

export const createCompany = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = companySchema.parse(req.body);

    const company = await prisma.company.create({
      data: {
        ...data,
        createdById: req.user.userId,
      },
    });

    // Create default Chart of Accounts
    await createDefaultChartOfAccounts(company.id);

    res.status(201).json(successResponse(company, 'Company created successfully'));
  } catch (error) {
    next(error);
  }
};

export const getCompanies = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companies = await prisma.company.findMany({
      where: { status: 'ACTIVE' },
      include: {
        _count: {
          select: { branches: true, employees: true, customers: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(successResponse(companies));
  } catch (error) {
    next(error);
  }
};

export const getCompany = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        branches: true,
        warehouses: true,
        accounts: {
          where: { parentId: null },
          include: { children: true },
        },
        _count: {
          select: {
            branches: true,
            warehouses: true,
            employees: true,
            customers: true,
            suppliers: true,
            items: true,
          },
        },
      },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    res.json(successResponse(company));
  } catch (error) {
    next(error);
  }
};

export const updateCompany = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = companySchema.partial().parse(req.body);

    const company = await prisma.company.update({
      where: { id },
      data,
    });

    res.json(successResponse(company, 'Company updated'));
  } catch (error) {
    next(error);
  }
};

export const deleteCompany = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.company.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    res.json(successResponse(null, 'Company deactivated'));
  } catch (error) {
    next(error);
  }
};

// Helper: Create default Chart of Accounts
async function createDefaultChartOfAccounts(companyId: string) {
  const accounts = [
    // Assets
    { code: '1000', name: 'Assets', nameAr: 'الأصول', type: 'ASSET', accountType: 'CURRENT_ASSET', isGroup: true },
    { code: '1100', name: 'Current Assets', nameAr: 'الأصول المتداولة', type: 'ASSET', accountType: 'CURRENT_ASSET', isGroup: true, parentCode: '1000' },
    { code: '1110', name: 'Cash', nameAr: 'النقدية', type: 'ASSET', accountType: 'CURRENT_ASSET', isGroup: true, parentCode: '1100' },
    { code: '1111', name: 'Cash on Hand', nameAr: 'النقدية بالصندوق', type: 'ASSET', accountType: 'CURRENT_ASSET', isGroup: false, parentCode: '1110' },
    { code: '1112', name: 'Bank Accounts', nameAr: 'الحسابات البنكية', type: 'ASSET', accountType: 'CURRENT_ASSET', isGroup: false, parentCode: '1110' },
    { code: '1120', name: 'Accounts Receivable', nameAr: 'ذمم العملاء', type: 'ASSET', accountType: 'CURRENT_ASSET', isGroup: false, parentCode: '1100' },
    { code: '1130', name: 'Inventory', nameAr: 'المخزون', type: 'ASSET', accountType: 'CURRENT_ASSET', isGroup: false, parentCode: '1100' },
    { code: '1200', name: 'Fixed Assets', nameAr: 'الأصول الثابتة', type: 'ASSET', accountType: 'FIXED_ASSET', isGroup: true, parentCode: '1000' },
    { code: '1210', name: 'Equipment', nameAr: 'المعدات', type: 'ASSET', accountType: 'FIXED_ASSET', isGroup: false, parentCode: '1200' },
    { code: '1220', name: 'Furniture', nameAr: 'الأثاث', type: 'ASSET', accountType: 'FIXED_ASSET', isGroup: false, parentCode: '1200' },

    // Liabilities
    { code: '2000', name: 'Liabilities', nameAr: 'الخصوم', type: 'LIABILITY', accountType: 'CURRENT_LIABILITY', isGroup: true },
    { code: '2100', name: 'Current Liabilities', nameAr: 'الخصوم المتداولة', type: 'LIABILITY', accountType: 'CURRENT_LIABILITY', isGroup: true, parentCode: '2000' },
    { code: '2110', name: 'Accounts Payable', nameAr: 'ذمم الموردين', type: 'LIABILITY', accountType: 'CURRENT_LIABILITY', isGroup: false, parentCode: '2100' },
    { code: '2120', name: 'Tax Payable', nameAr: 'الضريبة المستحقة', type: 'LIABILITY', accountType: 'CURRENT_LIABILITY', isGroup: false, parentCode: '2100' },
    { code: '2130', name: 'Salaries Payable', nameAr: 'الرواتب المستحقة', type: 'LIABILITY', accountType: 'CURRENT_LIABILITY', isGroup: false, parentCode: '2100' },

    // Equity
    { code: '3000', name: 'Equity', nameAr: 'حقوق الملكية', type: 'EQUITY', accountType: 'CAPITAL', isGroup: true },
    { code: '3100', name: 'Capital', nameAr: 'رأس المال', type: 'EQUITY', accountType: 'CAPITAL', isGroup: false, parentCode: '3000' },
    { code: '3200', name: 'Retained Earnings', nameAr: 'الأرباح المحتجزة', type: 'EQUITY', accountType: 'RETAINED_EARNINGS', isGroup: false, parentCode: '3000' },

    // Income
    { code: '4000', name: 'Income', nameAr: 'الإيرادات', type: 'INCOME', accountType: 'OPERATING_INCOME', isGroup: true },
    { code: '4100', name: 'Sales Revenue', nameAr: 'إيرادات المبيعات', type: 'INCOME', accountType: 'OPERATING_INCOME', isGroup: false, parentCode: '4000' },
    { code: '4200', name: 'Service Revenue', nameAr: 'إيرادات الخدمات', type: 'INCOME', accountType: 'OPERATING_INCOME', isGroup: false, parentCode: '4000' },
    { code: '4300', name: 'Other Income', nameAr: 'إيرادات أخرى', type: 'INCOME', accountType: 'OTHER_INCOME', isGroup: false, parentCode: '4000' },

    // Expenses
    { code: '5000', name: 'Expenses', nameAr: 'المصروفات', type: 'EXPENSE', accountType: 'OPERATING_EXPENSE', isGroup: true },
    { code: '5100', name: 'Cost of Goods Sold', nameAr: 'تكلفة البضاعة المباعة', type: 'EXPENSE', accountType: 'COST_OF_GOODS_SOLD', isGroup: false, parentCode: '5000' },
    { code: '5200', name: 'Salaries & Wages', nameAr: 'الرواتب والأجور', type: 'EXPENSE', accountType: 'ADMIN_EXPENSE', isGroup: false, parentCode: '5000' },
    { code: '5300', name: 'Rent Expense', nameAr: 'مصروف الإيجار', type: 'EXPENSE', accountType: 'ADMIN_EXPENSE', isGroup: false, parentCode: '5000' },
    { code: '5400', name: 'Utilities', nameAr: 'المرافق', type: 'EXPENSE', accountType: 'ADMIN_EXPENSE', isGroup: false, parentCode: '5000' },
    { code: '5500', name: 'Marketing', nameAr: 'التسويق', type: 'EXPENSE', accountType: 'SELLING_EXPENSE', isGroup: false, parentCode: '5000' },
    { code: '5600', name: 'Depreciation', nameAr: 'الإهلاك', type: 'EXPENSE', accountType: 'OPERATING_EXPENSE', isGroup: false, parentCode: '5000' },
    { code: '5700', name: 'Other Expenses', nameAr: 'مصروفات أخرى', type: 'EXPENSE', accountType: 'OTHER_EXPENSE', isGroup: false, parentCode: '5000' },
  ];

  const createdAccounts: Record<string, string> = {};

  for (const acc of accounts) {
    const parentId = acc.parentCode ? createdAccounts[acc.parentCode] : null;

    const created = await prisma.account.create({
      data: {
        code: acc.code,
        name: acc.name,
        nameAr: acc.nameAr,
        type: acc.type as any,
        accountType: acc.accountType as any,
        isGroup: acc.isGroup,
        companyId,
        parentId,
      },
    });

    createdAccounts[acc.code] = created.id;
  }
}
