import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const uomSchema = z.object({
  itemId: z.string(),
  uom: z.string().min(1),
  conversionFactor: z.number().positive(),
});

async function assertItemInCompany(companyId: string, itemId: string) {
  const item = await prisma.item.findFirst({ where: { id: itemId, companyId } });
  if (!item) throw new AppError('Item not found', 404);
  return item;
}

export const createUOMConversion = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = uomSchema.parse(req.body);
    const companyId = req.companyId!;
    await assertItemInCompany(companyId, data.itemId);

    const conversion = await prisma.uOMConversion.create({ data });
    res.status(201).json(successResponse(conversion, 'UOM conversion created'));
  } catch (error) {
    next(error);
  }
};

export const getUOMConversions = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { itemId } = req.query;
    if (!itemId) throw new AppError('itemId is required', 400);
    await assertItemInCompany(companyId, itemId as string);

    const conversions = await prisma.uOMConversion.findMany({ where: { itemId: itemId as string } });
    res.json(successResponse(conversions));
  } catch (error) {
    next(error);
  }
};

// Converts a quantity expressed in an alternative UOM into the item's base UOM.
export const convertQuantity = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { itemId, uom, quantity } = req.body;
    const item = await assertItemInCompany(companyId, itemId);

    if (uom === item.unitOfMeasure) {
      return res.json(successResponse({ baseQuantity: quantity, baseUom: item.unitOfMeasure }));
    }

    const conversion = await prisma.uOMConversion.findUnique({
      where: { itemId_uom: { itemId, uom } },
    });
    if (!conversion) throw new AppError(`No conversion defined for UOM "${uom}" on this item`, 404);

    const baseQuantity = Number(quantity) * Number(conversion.conversionFactor);
    res.json(successResponse({ baseQuantity, baseUom: item.unitOfMeasure }));
  } catch (error) {
    next(error);
  }
};

export const deleteUOMConversion = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const conversion = await prisma.uOMConversion.findUnique({ where: { id }, include: { item: true } });
    if (!conversion || conversion.item.companyId !== companyId) {
      throw new AppError('UOM conversion not found', 404);
    }

    await prisma.uOMConversion.delete({ where: { id } });
    res.json(successResponse(null, 'UOM conversion deleted'));
  } catch (error) {
    next(error);
  }
};
