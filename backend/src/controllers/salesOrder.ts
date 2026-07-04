import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const salesOrderSchema = z.object({
  orderDate: z.string().datetime(),
  deliveryDate: z.string().datetime().optional(),
  customerId: z.string(),
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
  return `SO-${year}${month}-${String(sequence).padStart(5, '0')}`;
}

export const createSalesOrder = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = salesOrderSchema.parse(req.body);
    const companyId = req.companyId!;
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

    const count = await prisma.salesOrder.count({ where: { companyId } });
    const orderNumber = generateOrderNumber(count + 1);

    const order = await prisma.salesOrder.create({
      data: {
        orderNumber,
        orderDate: new Date(data.orderDate),
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
        customerId: data.customerId,
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
      include: { items: { include: { item: true } }, customer: true },
    });

    res.status(201).json(successResponse(order, 'Sales order created'));
  } catch (error) {
    next(error);
  }
};

export const getSalesOrders = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    if (!companyId) throw new AppError('Company ID required', 400);
    const status = req.query.status as string | undefined;

    const orders = await prisma.salesOrder.findMany({
      where: { companyId, ...(status ? { status: status as any } : {}) },
      include: { customer: { select: { name: true } }, _count: { select: { items: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(successResponse(orders));
  } catch (error) {
    next(error);
  }
};

export const getSalesOrder = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: { items: { include: { item: true } }, customer: true },
    });
    if (!order) throw new AppError('Sales order not found', 404);
    res.json(successResponse(order));
  } catch (error) {
    next(error);
  }
};

export const submitSalesOrder = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const order = await prisma.salesOrder.update({ where: { id }, data: { status: 'SUBMITTED' } });
    res.json(successResponse(order, 'Sales order submitted'));
  } catch (error) {
    next(error);
  }
};

export const cancelSalesOrder = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const order = await prisma.salesOrder.update({ where: { id }, data: { status: 'CANCELLED' } });
    res.json(successResponse(order, 'Sales order cancelled'));
  } catch (error) {
    next(error);
  }
};
