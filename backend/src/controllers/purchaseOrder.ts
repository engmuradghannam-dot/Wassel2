import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const purchaseOrderSchema = z.object({
  orderDate: z.string().datetime(),
  deliveryDate: z.string().datetime().optional(),
  supplierId: z.string(),
  items: z.array(z.object({
    itemId: z.string(),
    description: z.string().optional(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    discountPercent: z.number().min(0).max(100).optional(),
    taxRate: z.number().min(0).max(100).optional(),
  })).min(1),
  discountAmount: z.number().min(0).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

function generateOrderNumber(sequence: number): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `PO-${year}${month}-${String(sequence).padStart(5, '0')}`;
}

export const createPurchaseOrder = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = purchaseOrderSchema.parse(req.body);
    const companyId = req.query.companyId || req.user?.companyId;
    if (!companyId) throw new AppError('Company ID required', 400);

    let subtotal = 0;
    let totalTax = 0;
    const orderItems = [];

    for (const item of data.items) {
      const itemData = await prisma.item.findUnique({ where: { id: item.itemId } });
      if (!itemData) throw new AppError(`Item not found: ${item.itemId}`, 404);

      const qty = item.quantity;
      const price = item.unitPrice;
      const discountPct = item.discountPercent || 0;
      const taxRate = item.taxRate ?? Number(itemData.taxRate);

      const itemSubtotal = qty * price;
      const discountAmount = itemSubtotal * (discountPct / 100);
      const taxableAmount = itemSubtotal - discountAmount;
      const taxAmount = taxableAmount * (taxRate / 100);
      const totalAmount = taxableAmount + taxAmount;

      subtotal += itemSubtotal - discountAmount;
      totalTax += taxAmount;

      orderItems.push({
        itemId: item.itemId,
        description: item.description || itemData.name,
        quantity: qty,
        unitPrice: price,
        discountPercent: discountPct,
        taxRate,
        totalAmount,
      });
    }

    const discountAmount = data.discountAmount || 0;
    const totalAmount = subtotal - discountAmount + totalTax;

    const count = await prisma.purchaseOrder.count({ where: { companyId } });
    const orderNumber = generateOrderNumber(count + 1);

    const order = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        orderDate: new Date(data.orderDate),
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
        supplierId: data.supplierId,
        subtotal,
        discountAmount,
        taxAmount: totalTax,
        totalAmount,
        notes: data.notes,
        terms: data.terms,
        companyId,
        createdById: req.user.userId,
        items: { create: orderItems },
      },
      include: { items: { include: { item: true } }, supplier: true },
    });

    res.status(201).json(successResponse(order, 'Purchase order created'));
  } catch (error) {
    next(error);
  }
};

export const getPurchaseOrders = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.query.companyId || req.user?.companyId;
    if (!companyId) throw new AppError('Company ID required', 400);
    const status = req.query.status as string | undefined;

    const orders = await prisma.purchaseOrder.findMany({
      where: { companyId, ...(status ? { status: status as any } : {}) },
      include: { supplier: { select: { name: true } }, _count: { select: { items: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(successResponse(orders));
  } catch (error) {
    next(error);
  }
};

export const getPurchaseOrder = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: { include: { item: true } }, supplier: true },
    });
    if (!order) throw new AppError('Purchase order not found', 404);
    res.json(successResponse(order));
  } catch (error) {
    next(error);
  }
};

export const submitPurchaseOrder = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const order = await prisma.purchaseOrder.update({ where: { id }, data: { status: 'SUBMITTED' } });
    res.json(successResponse(order, 'Purchase order submitted'));
  } catch (error) {
    next(error);
  }
};

export const cancelPurchaseOrder = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const order = await prisma.purchaseOrder.update({ where: { id }, data: { status: 'CANCELLED' } });
    res.json(successResponse(order, 'Purchase order cancelled'));
  } catch (error) {
    next(error);
  }
};
