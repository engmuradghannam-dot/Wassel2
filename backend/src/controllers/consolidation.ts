import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

// Attaches a company as a subsidiary of a parent company (group structure)
// for consolidated reporting. Both companies must belong to the same caller
// (checked via CompanyMember on each) to prevent linking unrelated tenants.
export const setParentCompany = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params; // subsidiary company id
    const { parentCompanyId } = z.object({ parentCompanyId: z.string() }).parse(req.body);

    if (id === parentCompanyId) throw new AppError('A company cannot be its own parent', 400);

    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
    if (!isSuperAdmin) {
      const [subMembership, parentMembership] = await Promise.all([
        prisma.companyMember.findUnique({ where: { userId_companyId: { userId: req.user.userId, companyId: id } } }),
        prisma.companyMember.findUnique({ where: { userId_companyId: { userId: req.user.userId, companyId: parentCompanyId } } }),
      ]);
      if (!subMembership || !parentMembership) {
        throw new AppError('You must be a member of both companies to link them', 403);
      }
    }

    const parent = await prisma.company.findUnique({ where: { id: parentCompanyId } });
    if (!parent) throw new AppError('Parent company not found', 404);

    // Prevent creating a cycle in the group hierarchy
    let cursor: string | null = parentCompanyId;
    const visited = new Set<string>();
    while (cursor) {
      if (cursor === id) throw new AppError('This would create a circular company group', 400);
      if (visited.has(cursor)) break;
      visited.add(cursor);
      const c: { parentCompanyId: string | null } | null = await prisma.company.findUnique({
        where: { id: cursor },
        select: { parentCompanyId: true },
      });
      cursor = c?.parentCompanyId ?? null;
    }

    const company = await prisma.company.update({ where: { id }, data: { parentCompanyId } });
    res.json(successResponse(company, 'Company linked to group'));
  } catch (error) {
    next(error);
  }
};

export const getGroupStructure = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params; // parent/root company id

    const company = await prisma.company.findUnique({
      where: { id },
      include: { subsidiaries: { include: { subsidiaries: true } } },
    });
    if (!company) throw new AppError('Company not found', 404);

    res.json(successResponse(company));
  } catch (error) {
    next(error);
  }
};

// Consolidates chart-of-accounts balances across a parent company and all
// its subsidiaries into a single report, converting each subsidiary's
// balances to the parent's currency using a supplied (or 1:1 default)
// exchange rate map.
export const getConsolidatedBalanceSheet = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params; // parent company id
    const exchangeRates: Record<string, number> = req.body?.exchangeRates || {};

    const parent = await prisma.company.findUnique({
      where: { id },
      include: { subsidiaries: true },
    });
    if (!parent) throw new AppError('Company not found', 404);

    const companyIds = [parent.id, ...parent.subsidiaries.map((s) => s.id)];
    const companies = [parent, ...parent.subsidiaries];

    const accounts = await prisma.account.findMany({
      where: { companyId: { in: companyIds }, isGroup: false },
    });

    const consolidated: Record<string, { accountType: string; totalBalance: number; breakdown: any[] }> = {};

    for (const account of accounts) {
      const company = companies.find((c) => c.id === account.companyId)!;
      const rate = company.id === parent.id ? 1 : (exchangeRates[company.currency] ?? 1);
      const convertedBalance = Number(account.currentBalance) * rate;

      const key = `${account.accountType}:${account.name}`;
      if (!consolidated[key]) {
        consolidated[key] = { accountType: account.accountType, totalBalance: 0, breakdown: [] };
      }
      consolidated[key].totalBalance += convertedBalance;
      consolidated[key].breakdown.push({
        companyId: company.id,
        companyName: company.name,
        originalBalance: Number(account.currentBalance),
        originalCurrency: company.currency,
        convertedBalance,
      });
    }

    res.json(successResponse({
      parentCompany: { id: parent.id, name: parent.name, currency: parent.currency },
      subsidiaryCount: parent.subsidiaries.length,
      accounts: Object.entries(consolidated).map(([key, v]) => ({ account: key, ...v })),
    }));
  } catch (error) {
    next(error);
  }
};
