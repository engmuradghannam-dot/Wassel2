import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

// Generates a sales forecast for the next period using either a simple
// moving average or linear regression over historical submitted sales
// invoices, grouped by calendar month. This is a deterministic statistical
// forecast (no external ML/AI service involved), scoped per item if an
// itemId is given, otherwise across total company sales.
export const generateForecast = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const schema = z.object({
      itemId: z.string().optional(),
      method: z.enum(['MOVING_AVERAGE', 'LINEAR_REGRESSION']).default('MOVING_AVERAGE'),
      lookbackMonths: z.number().int().min(2).max(36).default(6),
    });
    const { itemId, method, lookbackMonths } = schema.parse(req.body ?? {});

    if (itemId) {
      const item = await prisma.item.findFirst({ where: { id: itemId, companyId } });
      if (!item) throw new AppError('Item not found', 404);
    }

    const since = new Date();
    since.setMonth(since.getMonth() - lookbackMonths);

    let monthlyTotals: number[];

    if (itemId) {
      const invoiceItems = await prisma.invoiceItem.findMany({
        where: {
          itemId,
          invoice: { companyId, invoiceType: 'SALES', status: { not: 'CANCELLED' }, invoiceDate: { gte: since } },
        },
        include: { invoice: { select: { invoiceDate: true } } },
      });
      monthlyTotals = bucketByMonth(
        invoiceItems.map((i) => ({ date: i.invoice.invoiceDate, amount: Number(i.totalAmount) })),
        lookbackMonths,
      );
    } else {
      const invoices = await prisma.invoice.findMany({
        where: { companyId, invoiceType: 'SALES', status: { not: 'CANCELLED' }, invoiceDate: { gte: since } },
        select: { invoiceDate: true, totalAmount: true },
      });
      monthlyTotals = bucketByMonth(
        invoices.map((i) => ({ date: i.invoiceDate, amount: Number(i.totalAmount) })),
        lookbackMonths,
      );
    }

    if (monthlyTotals.every((v) => v === 0)) {
      throw new AppError('Not enough historical sales data to generate a forecast', 400);
    }

    const { predicted, confidence } = method === 'LINEAR_REGRESSION'
      ? linearRegressionForecast(monthlyTotals)
      : movingAverageForecast(monthlyTotals);

    const periodStart = new Date();
    periodStart.setDate(1);
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    periodEnd.setDate(0);

    const forecast = await prisma.salesForecast.create({
      data: {
        companyId,
        itemId: itemId ?? null,
        method,
        periodStart,
        periodEnd,
        predictedAmount: Math.max(predicted, 0),
        confidence,
      },
    });

    res.status(201).json(successResponse({
      ...forecast,
      historicalMonthlyTotals: monthlyTotals,
    }, 'Forecast generated'));
  } catch (error) {
    next(error);
  }
};

function bucketByMonth(records: { date: Date; amount: number }[], months: number): number[] {
  const buckets = new Array(months).fill(0);
  const now = new Date();
  for (const r of records) {
    const monthsAgo = (now.getFullYear() - r.date.getFullYear()) * 12 + (now.getMonth() - r.date.getMonth());
    const idx = months - 1 - monthsAgo;
    if (idx >= 0 && idx < months) buckets[idx] += r.amount;
  }
  return buckets;
}

function movingAverageForecast(series: number[]): { predicted: number; confidence: number } {
  const window = series.slice(-3);
  const predicted = window.reduce((a, b) => a + b, 0) / window.length;
  const mean = series.reduce((a, b) => a + b, 0) / series.length;
  const variance = series.reduce((sum, v) => sum + (v - mean) ** 2, 0) / series.length;
  const stdDev = Math.sqrt(variance);
  const confidence = mean === 0 ? 0 : Math.max(0, Math.min(100, 100 - (stdDev / mean) * 100));
  return { predicted, confidence: Math.round(confidence * 100) / 100 };
}

function linearRegressionForecast(series: number[]): { predicted: number; confidence: number } {
  const n = series.length;
  const xs = series.map((_, i) => i);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = series.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (series[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  const predicted = slope * n + intercept;

  // R-squared as a confidence proxy
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const fitted = slope * xs[i] + intercept;
    ssRes += (series[i] - fitted) ** 2;
    ssTot += (series[i] - yMean) ** 2;
  }
  const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  const confidence = Math.max(0, Math.min(100, rSquared * 100));

  return { predicted, confidence: Math.round(confidence * 100) / 100 };
}

export const getForecasts = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { itemId } = req.query;

    const where: any = { companyId };
    if (itemId) where.itemId = itemId as string;

    const forecasts = await prisma.salesForecast.findMany({
      where,
      include: { item: { select: { name: true, code: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(successResponse(forecasts));
  } catch (error) {
    next(error);
  }
};
