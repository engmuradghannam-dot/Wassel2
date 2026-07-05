import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';

const zakatSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  hijriYear: z.string().optional(),
  cash: z.number().default(0),
  inventory: z.number().default(0),
  receivables: z.number().default(0),
  investments: z.number().default(0),
  goldSilver: z.number().default(0),
  debts: z.number().default(0),
  nisabThreshold: z.number().default(85000),
  zakatRate: z.number().default(0.025),
});

export const calculateZakat = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = zakatSchema.parse(req.body);
    const companyId = req.companyId!;

    const totalAssets = data.cash + data.inventory + data.receivables + data.investments + data.goldSilver;
    const netAssets = totalAssets - data.debts;
    const zakatPayable = netAssets >= data.nisabThreshold ? netAssets * data.zakatRate : 0;

    const result = {
      year: data.year, hijriYear: data.hijriYear,
      breakdown: { cash: data.cash, inventory: data.inventory, receivables: data.receivables,
        investments: data.investments, goldSilver: data.goldSilver, totalAssets, debts: data.debts, netAssets },
      nisabThreshold: data.nisabThreshold, nisabApplicable: netAssets >= data.nisabThreshold,
      zakatRate: data.zakatRate, zakatAmount: Math.round(zakatPayable * 100) / 100, currency: 'SAR',
    };

    await prisma.zakatCalculation.create({
      data: {
        companyId, year: data.year, hijriYear: data.hijriYear,
        cash: data.cash, inventory: data.inventory, receivables: data.receivables,
        investments: data.investments, goldSilver: data.goldSilver, debts: data.debts,
        totalAssets, netAssets, zakatAmount: result.zakatAmount,
        nisabThreshold: data.nisabThreshold, calculatedBy: req.user.userId,
      },
    });

    res.json(successResponse(result, 'Zakat calculated successfully'));
  } catch (error) {
    next(error);
  }
};

export const getZakatHistory = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { year } = req.query;
    const where: any = { companyId };
    if (year) where.year = parseInt(year as string);

    const history = await prisma.zakatCalculation.findMany({
      where, orderBy: { year: 'desc' },
      include: { calculator: { select: { firstName: true, lastName: true } } },
    });
    res.json(successResponse(history));
  } catch (error) {
    next(error);
  }
};

export const getZakatReport = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { year } = req.params;
    const calculation = await prisma.zakatCalculation.findFirst({
      where: { companyId, year: parseInt(year) },
    });
    if (!calculation) return res.json(successResponse(null, 'No zakat calculation found'));

    const accounts = await prisma.account.findMany({
      where: { companyId, accountType: { in: ['CURRENT_ASSET', 'FIXED_ASSET', 'INTANGIBLE_ASSET', 'CURRENT_LIABILITY', 'LONG_TERM_LIABILITY'] } },
      select: { name: true, accountType: true, currentBalance: true },
    });

    res.json(successResponse({ calculation, accountSummary: accounts, generatedAt: new Date().toISOString() }));
  } catch (error) {
    next(error);
  }
};
