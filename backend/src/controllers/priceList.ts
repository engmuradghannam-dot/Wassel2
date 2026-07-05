import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const priceListSchema = z.object({
  name: z.string().min(1),
  currency: z.string().default('SAR'),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  customerGroup: z.string().optional(),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
});

export const createPriceList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = priceListSchema.parse(req.body);
    const companyId = req.companyId!;

    if (data.isDefault) {
      await prisma.priceList.updateMany({ where: { companyId, isDefault: true }, data: { isDefault: false } });
    }

    const priceList = await prisma.priceList.create({ data: { ...data, companyId } });
    res.status(201).json(successResponse(priceList, 'Price list created'));
  } catch (error) {
    next(error);
  }
};

export const getPriceLists = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const priceLists = await prisma.priceList.findMany({
      where: { companyId },
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(successResponse(priceLists));
  } catch (error) {
    next(error);
  }
};

export const getPriceList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const priceList = await prisma.priceList.findFirst({
      where: { id, companyId },
      include: { items: { include: { item: { select: { name: true, code: true } } } } },
    });
    if (!priceList) throw new AppError('Price list not found', 404);
    res.json(successResponse(priceList));
  } catch (error) {
    next(error);
  }
};

export const addPriceListItem = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const priceList = await prisma.priceList.findFirst({ where: { id, companyId } });
    if (!priceList) throw new AppError('Price list not found', 404);

    const itemSchema = z.object({
      itemId: z.string(),
      price: z.number().min(0),
      minQty: z.number().positive().default(1),
    });
    const data = itemSchema.parse(req.body);

    const item = await prisma.item.findFirst({ where: { id: data.itemId, companyId } });
    if (!item) throw new AppError('Item not found', 404);

    const priceListItem = await prisma.priceListItem.upsert({
      where: { priceListId_itemId_minQty: { priceListId: id, itemId: data.itemId, minQty: data.minQty } },
      update: { price: data.price },
      create: { ...data, priceListId: id },
    });

    res.status(201).json(successResponse(priceListItem, 'Price list item added'));
  } catch (error) {
    next(error);
  }
};

// Resolves the applicable price for an item/quantity/customer combination:
// picks the customer's assigned price list (by customerGroup) if one exists
// and is currently valid, falling back to the company default price list,
// and finally to the item's own base sellingPrice.
export const resolvePrice = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { itemId, quantity, customerId } = req.query;
    if (!itemId) throw new AppError('itemId is required', 400);

    const item = await prisma.item.findFirst({ where: { id: itemId as string, companyId } });
    if (!item) throw new AppError('Item not found', 404);

    const qty = Number(quantity) || 1;
    const now = new Date();

    let customerGroup: string | undefined;
    if (customerId) {
      const customer = await prisma.customer.findFirst({ where: { id: customerId as string, companyId } });
      customerGroup = customer?.customerGroup ?? undefined;
    }

    const candidateLists = await prisma.priceList.findMany({
      where: {
        companyId,
        isActive: true,
        OR: [
          { customerGroup: customerGroup ?? undefined },
          { isDefault: true },
        ],
        AND: [
          { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
          { OR: [{ validTo: null }, { validTo: { gte: now } }] },
        ],
      },
      include: {
        items: {
          where: { itemId: itemId as string, minQty: { lte: qty } },
          orderBy: { minQty: 'desc' },
          take: 1,
        },
      },
      orderBy: { isDefault: 'asc' }, // non-default (customer-group specific) lists first
    });

    const match = candidateLists.find((pl) => pl.items.length > 0);
    if (match) {
      return res.json(successResponse({
        price: Number(match.items[0].price),
        priceListId: match.id,
        priceListName: match.name,
        source: match.isDefault ? 'DEFAULT_PRICE_LIST' : 'CUSTOMER_GROUP_PRICE_LIST',
      }));
    }

    res.json(successResponse({
      price: Number(item.sellingPrice),
      priceListId: null,
      priceListName: null,
      source: 'ITEM_BASE_PRICE',
    }));
  } catch (error) {
    next(error);
  }
};

export const deletePriceList = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const priceList = await prisma.priceList.findFirst({ where: { id, companyId } });
    if (!priceList) throw new AppError('Price list not found', 404);

    await prisma.priceList.delete({ where: { id } });
    res.json(successResponse(null, 'Price list deleted'));
  } catch (error) {
    next(error);
  }
};
