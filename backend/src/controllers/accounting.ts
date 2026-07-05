import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const accountSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(2),
  nameAr: z.string().optional(),
  alternativeAccountNumber: z.string().optional(),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE']),
  accountType: z.enum([
    'CURRENT_ASSET', 'FIXED_ASSET', 'INTANGIBLE_ASSET',
    'CURRENT_LIABILITY', 'LONG_TERM_LIABILITY',
    'CAPITAL', 'RETAINED_EARNINGS',
    'OPERATING_INCOME', 'OTHER_INCOME',
    'COST_OF_GOODS_SOLD', 'OPERATING_EXPENSE', 'ADMIN_EXPENSE', 'SELLING_EXPENSE', 'OTHER_EXPENSE',
  ]),
  parentId: z.string().optional(),
  isGroup: z.boolean().default(false),
  isBank: z.boolean().default(false),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  currency: z.string().default('SAR'),
  openingBalance: z.number().default(0),
  isReconciliationAccount: z.boolean().default(false),
  reconciliationAccountType: z.enum(['CUSTOMER', 'SUPPLIER', 'ASSET']).optional(),
  openItemManagement: z.boolean().default(false),
  lineItemDisplay: z.boolean().default(true),
  blockedForPosting: z.boolean().default(false),
  taxCategory: z.string().optional(),
});

export const createAccount = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = accountSchema.parse(req.body);
    const companyId = req.companyId!;
    if (!companyId) throw new AppError('Company ID required', 400);

    const account = await prisma.account.create({
      data: {
        ...data,
        currentBalance: data.openingBalance,
        companyId,
      },
    });

    res.status(201).json(successResponse(account, 'Account created'));
  } catch (error: any) {
    if (error?.code === 'P2002') return next(new AppError('Account code already exists', 409));
    next(error);
  }
};

export const getAccounts = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    if (!companyId) throw new AppError('Company ID required', 400);

    const accounts = await prisma.account.findMany({
      where: { companyId, status: 'ACTIVE' },
      orderBy: { code: 'asc' },
    });

    res.json(successResponse(accounts));
  } catch (error) {
    next(error);
  }
};

export const updateAccount = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = accountSchema.partial().parse(req.body);

    const account = await prisma.account.update({ where: { id }, data });
    res.json(successResponse(account, 'Account updated'));
  } catch (error: any) {
    if (error?.code === 'P2002') return next(new AppError('Account code already exists', 409));
    next(error);
  }
};

export const deleteAccount = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.account.update({ where: { id }, data: { status: 'INACTIVE' } });
    res.json(successResponse(null, 'Account deactivated'));
  } catch (error) {
    next(error);
  }
};

// ==================== Journal Entries ====================

const journalEntrySchema = z.object({
  entryDate: z.string().datetime(),
  reference: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(z.object({
    debitAccountId: z.string().optional(),
    creditAccountId: z.string().optional(),
    amount: z.number().positive(),
    description: z.string().optional(),
    costCenterId: z.string().optional(),
  })).min(1),
});

function generateEntryNumber(sequence: number): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `JE-${year}${month}-${String(sequence).padStart(5, '0')}`;
}

export const createJournalEntry = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = journalEntrySchema.parse(req.body);
    const companyId = req.companyId!;
    if (!companyId) throw new AppError('Company ID required', 400);

    for (const line of data.lines) {
      if (!line.debitAccountId && !line.creditAccountId) {
        throw new AppError('Each line needs a debit or credit account', 400);
      }
      if (line.debitAccountId) {
        const acct = await prisma.account.findFirst({ where: { id: line.debitAccountId, companyId } });
        if (!acct) throw new AppError('Debit account not found', 404);
        if (acct.blockedForPosting) throw new AppError(`Account ${acct.code} is blocked for posting`, 400);
      }
      if (line.creditAccountId) {
        const acct = await prisma.account.findFirst({ where: { id: line.creditAccountId, companyId } });
        if (!acct) throw new AppError('Credit account not found', 404);
        if (acct.blockedForPosting) throw new AppError(`Account ${acct.code} is blocked for posting`, 400);
      }
      if (line.costCenterId) {
        const cc = await prisma.costCenter.findFirst({ where: { id: line.costCenterId, companyId } });
        if (!cc) throw new AppError('Cost center not found', 404);
      }
    }

    const totalDebit = data.lines.reduce((sum, l) => sum + (l.debitAccountId ? l.amount : 0), 0);
    const totalCredit = data.lines.reduce((sum, l) => sum + (l.creditAccountId ? l.amount : 0), 0);

    const count = await prisma.journalEntry.count({ where: { companyId } });
    const entryNumber = generateEntryNumber(count + 1);

    const entry = await prisma.journalEntry.create({
      data: {
        entryNumber,
        entryDate: new Date(data.entryDate),
        reference: data.reference,
        description: data.description,
        notes: data.notes,
        totalDebit,
        totalCredit,
        companyId,
        createdById: req.user.userId,
        lines: {
          create: data.lines.map((l) => ({
            debitAccountId: l.debitAccountId,
            creditAccountId: l.creditAccountId,
            amount: l.amount,
            description: l.description,
            costCenterId: l.costCenterId,
          })),
        },
      },
      include: { lines: { include: { debitAccount: true, creditAccount: true } } },
    });

    res.status(201).json(successResponse(entry, 'Journal entry created'));
  } catch (error) {
    next(error);
  }
};

export const getJournalEntries = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    if (!companyId) throw new AppError('Company ID required', 400);

    const entries = await prisma.journalEntry.findMany({
      where: { companyId },
      include: { lines: { include: { debitAccount: true, creditAccount: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(successResponse(entries));
  } catch (error) {
    next(error);
  }
};

export const postJournalEntry = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const entry = await prisma.journalEntry.findUnique({ where: { id }, include: { lines: true } });
    if (!entry) throw new AppError('Journal entry not found', 404);
    if (entry.status === 'POSTED') throw new AppError('Journal entry already posted', 400);

    // Apply balance movements: debit increases ASSET/EXPENSE, credit increases LIABILITY/EQUITY/INCOME
    // Simplified: just increment debit account balances and decrement credit account balances by amount.
    await prisma.$transaction([
      ...entry.lines.flatMap((line) => {
        const ops = [];
        if (line.debitAccountId) {
          ops.push(prisma.account.update({
            where: { id: line.debitAccountId },
            data: { currentBalance: { increment: line.amount } },
          }));
        }
        if (line.creditAccountId) {
          ops.push(prisma.account.update({
            where: { id: line.creditAccountId },
            data: { currentBalance: { decrement: line.amount } },
          }));
        }
        return ops;
      }),
      prisma.journalEntry.update({
        where: { id },
        data: { status: 'POSTED', postedAt: new Date(), postedById: req.user.userId },
      }),
    ]);

    res.json(successResponse(null, 'Journal entry posted'));
  } catch (error) {
    next(error);
  }
};

export const cancelJournalEntry = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.journalEntry.update({ where: { id }, data: { status: 'CANCELLED' } });
    res.json(successResponse(null, 'Journal entry cancelled'));
  } catch (error) {
    next(error);
  }
};
