import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

function requireCompanyId(req: any): string {
  const companyId = req.query.companyId || req.user?.companyId;
  if (!companyId) throw new AppError('Company ID required', 400);
  return companyId;
}

// Trial Balance — every account with its current balance, split by debit/credit
// side according to its normal balance type (Asset/Expense = debit normal,
// Liability/Equity/Income = credit normal).
export const getTrialBalance = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = requireCompanyId(req);
    const accounts = await prisma.account.findMany({
      where: { companyId, status: 'ACTIVE' },
      orderBy: { code: 'asc' },
    });

    const debitNormal = new Set(['ASSET', 'EXPENSE']);
    let totalDebit = 0;
    let totalCredit = 0;

    const rows = accounts.map((acc) => {
      const balance = Number(acc.currentBalance);
      const isDebitNormal = debitNormal.has(acc.type);
      const debit = isDebitNormal ? Math.max(balance, 0) : Math.max(-balance, 0);
      const credit = isDebitNormal ? Math.max(-balance, 0) : Math.max(balance, 0);
      totalDebit += debit;
      totalCredit += credit;
      return { code: acc.code, name: acc.name, type: acc.type, debit, credit };
    });

    res.json(successResponse({ rows, totalDebit, totalCredit }));
  } catch (error) {
    next(error);
  }
};

// Profit & Loss — Income accounts minus Expense accounts.
export const getProfitAndLoss = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = requireCompanyId(req);
    const accounts = await prisma.account.findMany({ where: { companyId, status: 'ACTIVE' } });

    const income = accounts.filter((a) => a.type === 'INCOME');
    const expense = accounts.filter((a) => a.type === 'EXPENSE');

    const totalIncome = income.reduce((s, a) => s + Number(a.currentBalance), 0);
    const totalExpense = expense.reduce((s, a) => s + Number(a.currentBalance), 0);

    res.json(successResponse({
      income: income.map((a) => ({ code: a.code, name: a.name, amount: Number(a.currentBalance) })),
      expense: expense.map((a) => ({ code: a.code, name: a.name, amount: Number(a.currentBalance) })),
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
    }));
  } catch (error) {
    next(error);
  }
};

// Balance Sheet — Assets vs Liabilities + Equity.
export const getBalanceSheet = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = requireCompanyId(req);
    const accounts = await prisma.account.findMany({ where: { companyId, status: 'ACTIVE' } });

    const assets = accounts.filter((a) => a.type === 'ASSET');
    const liabilities = accounts.filter((a) => a.type === 'LIABILITY');
    const equity = accounts.filter((a) => a.type === 'EQUITY');

    const totalAssets = assets.reduce((s, a) => s + Number(a.currentBalance), 0);
    const totalLiabilities = liabilities.reduce((s, a) => s + Number(a.currentBalance), 0);
    const totalEquity = equity.reduce((s, a) => s + Number(a.currentBalance), 0);

    res.json(successResponse({
      assets: assets.map((a) => ({ code: a.code, name: a.name, amount: Number(a.currentBalance) })),
      liabilities: liabilities.map((a) => ({ code: a.code, name: a.name, amount: Number(a.currentBalance) })),
      equity: equity.map((a) => ({ code: a.code, name: a.name, amount: Number(a.currentBalance) })),
      totalAssets,
      totalLiabilities,
      totalEquity,
      balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    }));
  } catch (error) {
    next(error);
  }
};

// Stock Report — current valuation per item/warehouse (from BinCard).
export const getStockReport = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = requireCompanyId(req);
    const bins = await prisma.binCard.findMany({
      where: { warehouse: { companyId } },
      include: { item: { select: { name: true, code: true, unitOfMeasure: true } }, warehouse: { select: { name: true } } },
    });

    const totalValue = bins.reduce((s, b) => s + Number(b.totalValue), 0);
    res.json(successResponse({ rows: bins, totalValue }));
  } catch (error) {
    next(error);
  }
};

// Sales Report — invoices grouped by status, with totals.
export const getSalesReport = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = requireCompanyId(req);
    const invoices = await prisma.invoice.findMany({
      where: { companyId, invoiceType: 'SALES' },
      include: { customer: { select: { name: true } } },
      orderBy: { invoiceDate: 'desc' },
    });

    const totalSales = invoices.reduce((s, i) => s + Number(i.totalAmount), 0);
    const totalPaid = invoices.reduce((s, i) => s + Number(i.paidAmount), 0);
    const totalOutstanding = invoices.reduce((s, i) => s + Number(i.balanceDue), 0);

    res.json(successResponse({ rows: invoices, totalSales, totalPaid, totalOutstanding }));
  } catch (error) {
    next(error);
  }
};

// Payroll Report — payrolls for a period, with totals.
export const getPayrollReport = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = requireCompanyId(req);
    const payrolls = await prisma.payroll.findMany({
      where: { employee: { companyId } },
      include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true } } },
      orderBy: { periodStart: 'desc' },
    });

    const totalNet = payrolls.reduce((s, p) => s + Number(p.netSalary), 0);
    const totalGosi = payrolls.reduce((s, p) => s + Number(p.gosiEmployee) + Number(p.gosiCompany), 0);

    res.json(successResponse({ rows: payrolls, totalNet, totalGosi }));
  } catch (error) {
    next(error);
  }
};
