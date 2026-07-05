import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const settingsSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
  category: z.string().optional(),
});

export const getSettings = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { category } = req.query;

    const where: any = { OR: [{ companyId }, { companyId: null, isGlobal: true }] };
    if (category) where.category = category as string;

    const settings = await prisma.systemSetting.findMany({ where });
    const settingsMap = settings.reduce((acc: any, s) => { acc[s.key] = s.value; return acc; }, {});
    res.json(successResponse(settingsMap));
  } catch (error) {
    next(error);
  }
};

export const updateSetting = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { key, value, category } = settingsSchema.parse(req.body);

    const setting = await prisma.systemSetting.upsert({
      where: { key_companyId: { key, companyId: companyId || 'global' } },
      update: { value, category, updatedAt: new Date() },
      create: { key, value, category: category || 'GENERAL', companyId, isGlobal: !companyId },
    });

    res.json(successResponse(setting, 'Setting updated'));
  } catch (error) {
    next(error);
  }
};

export const getCompanySettings = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true, name: true, nameAr: true, taxId: true, logo: true,
        address: true, phone: true, email: true, currency: true,
        fiscalYearStart: true, fiscalYearEnd: true,
      },
    });
    res.json(successResponse(company));
  } catch (error) {
    next(error);
  }
};

export const updateCompanySettings = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const data = req.body;
    const company = await prisma.company.update({ where: { id: companyId }, data });
    res.json(successResponse(company, 'Company settings updated'));
  } catch (error) {
    next(error);
  }
};
