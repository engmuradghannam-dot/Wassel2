import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const assetSchema = z.object({
  assetName: z.string().min(2),
  assetNameAr: z.string().optional(),
  assetCategory: z.string(),
  itemCode: z.string().optional(),
  purchaseDate: z.string().datetime(),
  purchaseAmount: z.number().positive(),
  depreciationMethod: z.enum(['STRAIGHT_LINE', 'DECLINING_BALANCE', 'UNITS_OF_PRODUCTION']).default('STRAIGHT_LINE'),
  usefulLife: z.number().positive(), // years
  salvageValue: z.number().min(0).default(0),
  location: z.string().optional(),
  custodian: z.string().optional(),
  serialNo: z.string().optional(),
  notes: z.string().optional(),
});

export const createAsset = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = assetSchema.parse(req.body);
    const companyId = req.companyId!;
    if (!companyId) throw new AppError('Company ID required', 400);

    const assetNumber = `AST-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2,6).toUpperCase()}`;

    // Calculate depreciation
    const depreciableAmount = data.purchaseAmount - data.salvageValue;
    const annualDepreciation = data.depreciationMethod === 'STRAIGHT_LINE'
      ? depreciableAmount / data.usefulLife
      : 0;

    const asset = await prisma.asset.create({
      data: {
        assetNumber,
        assetName: data.assetName,
        assetNameAr: data.assetNameAr,
        assetCategory: data.assetCategory,
        itemCode: data.itemCode,
        purchaseDate: new Date(data.purchaseDate),
        purchaseAmount: data.purchaseAmount,
        depreciationMethod: data.depreciationMethod,
        usefulLife: data.usefulLife,
        salvageValue: data.salvageValue,
        annualDepreciation,
        accumulatedDepreciation: 0,
        netBookValue: data.purchaseAmount,
        location: data.location,
        custodian: data.custodian,
        serialNo: data.serialNo,
        notes: data.notes,
        status: 'ACTIVE',
        companyId,
        createdById: req.user.userId,
      },
    });

    res.status(201).json(successResponse(asset, 'Asset created'));
  } catch (error) {
    next(error);
  }
};

export const getAssets = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const category = req.query.category;
    const status = req.query.status;
    const where: any = { companyId };
    if (category) where.assetCategory = category;
    if (status) where.status = status;

    const assets = await prisma.asset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(successResponse(assets));
  } catch (error) {
    next(error);
  }
};

export const depreciateAsset = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) throw new AppError('Asset not found', 404);

    const newAccumulated = Number(asset.accumulatedDepreciation) + Number(asset.annualDepreciation);
    const newNetBookValue = Number(asset.purchaseAmount) - newAccumulated;

    const updated = await prisma.asset.update({
      where: { id },
      data: {
        accumulatedDepreciation: newAccumulated,
        netBookValue: newNetBookValue > 0 ? newNetBookValue : 0,
      },
    });

    res.json(successResponse(updated, 'Depreciation applied'));
  } catch (error) {
    next(error);
  }
};

export const disposeAsset = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { disposalDate, disposalValue, reason } = req.body;

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        status: 'DISPOSED',
        disposalDate: new Date(disposalDate),
        disposalValue: disposalValue || 0,
        notes: reason,
      },
    });

    res.json(successResponse(asset, 'Asset disposed'));
  } catch (error) {
    next(error);
  }
};

export const getAssetCategories = async (req: any, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.asset.groupBy({
      by: ['assetCategory'],
      _count: { id: true },
      _sum: { purchaseAmount: true, netBookValue: true },
      where: { companyId: req.companyId! },
    });
    res.json(successResponse(categories));
  } catch (error) {
    next(error);
  }
};
