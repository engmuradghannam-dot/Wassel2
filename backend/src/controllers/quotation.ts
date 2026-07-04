import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const quotationSchema = z.object({
  quotationDate: z.string().datetime(),
  validUntil: z.string().datetime(),
  customerId: z.string(),
  items: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    discountPercent: z.number().min(0).max(100).optional(),
    taxRate: z.number().min(0).max(100).optional(),
  })).min(1),
  discountAmount: z.number().min(0).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

function generateNumber(prefix: string, sequence: number): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${prefix}-${year}${month}-${String(sequence).padStart(5, '0')}`;
}

export const createQuotation = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = quotationSchema.parse(req.body);
    const companyId = req.companyId!;

    let subtotal = 0;
    let totalTax = 0;
    const quotationItems = [];

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

      quotationItems.push({
        itemId: item.itemId,
        quantity: qty,
        unitPrice: price,
        discountPercent: discountPct,
        taxRate,
        totalAmount,
      });
    }

    const discountAmount = data.discountAmount || 0;
    const totalAmount = subtotal - discountAmount + totalTax;

    const count = await prisma.quotation.count({ where: { companyId } });
    const quotationNumber = generateNumber('QT', count + 1);

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        quotationDate: new Date(data.quotationDate),
        validUntil: new Date(data.validUntil),
        customerId: data.customerId,
        subtotal,
        discountAmount,
        taxAmount: totalTax,
        totalAmount,
        notes: data.notes,
        terms: data.terms,
        companyId,
        createdById: req.user.userId,
        items: { create: quotationItems },
      },
      include: { items: { include: { item: true } }, customer: true },
    });

    res.status(201).json(successResponse(quotation, 'Quotation created'));
  } catch (error) {
    next(error);
  }
};

export const getQuotations = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const status = req.query.status as string | undefined;

    const quotations = await prisma.quotation.findMany({
      where: { companyId, ...(status ? { status: status as any } : {}) },
      include: { customer: { select: { name: true } }, _count: { select: { items: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(successResponse(quotations));
  } catch (error) {
    next(error);
  }
};

export const getQuotation = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { id } = req.params;

    const quotation = await prisma.quotation.findFirst({
      where: { id, companyId },
      include: { items: { include: { item: true } }, customer: true },
    });
    if (!quotation) throw new AppError('Quotation not found', 404);

    res.json(successResponse(quotation));
  } catch (error) {
    next(error);
  }
};

export const sendQuotation = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { id } = req.params;

    const existing = await prisma.quotation.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Quotation not found', 404);

    const quotation = await prisma.quotation.update({ where: { id }, data: { status: 'SENT' } });
    res.json(successResponse(quotation, 'Quotation marked as sent'));
  } catch (error) {
    next(error);
  }
};

export const cancelQuotation = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { id } = req.params;

    const existing = await prisma.quotation.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Quotation not found', 404);
    if (existing.status === 'CONVERTED') throw new AppError('Cannot reject a quotation already converted to a sales order', 400);

    const quotation = await prisma.quotation.update({ where: { id }, data: { status: 'REJECTED' } });
    res.json(successResponse(quotation, 'Quotation rejected'));
  } catch (error) {
    next(error);
  }
};

// Turns an accepted quotation directly into a sales order, carrying over the
// same items/pricing so nothing has to be retyped.
export const convertQuotationToSalesOrder = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { id } = req.params;

    const quotation = await prisma.quotation.findFirst({
      where: { id, companyId },
      include: { items: true },
    });
    if (!quotation) throw new AppError('Quotation not found', 404);
    if (quotation.convertedToSalesOrderId) throw new AppError('Quotation already converted', 400);

    const salesOrder = await prisma.$transaction(async (tx) => {
      const count = await tx.salesOrder.count({ where: { companyId } });
      const orderNumber = generateNumber('SO', count + 1);

      const created = await tx.salesOrder.create({
        data: {
          orderNumber,
          orderDate: new Date(),
          customerId: quotation.customerId,
          subtotal: quotation.subtotal,
          discountAmount: quotation.discountAmount,
          taxAmount: quotation.taxAmount,
          totalAmount: quotation.totalAmount,
          notes: quotation.notes,
          terms: quotation.terms,
          companyId,
          createdById: req.user.userId,
          items: {
            create: quotation.items.map((it) => ({
              itemId: it.itemId,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              discountPercent: it.discountPercent,
              taxRate: it.taxRate,
              totalAmount: it.totalAmount,
            })),
          },
        },
      });

      await tx.quotation.update({
        where: { id },
        data: { status: 'CONVERTED', convertedToSalesOrderId: created.id },
      });

      return created;
    });

    res.status(201).json(successResponse(salesOrder, 'Quotation converted to sales order'));
  } catch (error) {
    next(error);
  }
};
