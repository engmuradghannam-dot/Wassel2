import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const invoiceSchema = z.object({
  invoiceType: z.enum(['SALES', 'PURCHASE', 'CREDIT_NOTE', 'DEBIT_NOTE']),
  invoiceDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
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

function generateInvoiceNumber(prefix: string, sequence: number): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${prefix}-${year}${month}-${String(sequence).padStart(5, '0')}`;
}

export const createInvoice = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = invoiceSchema.parse(req.body);
    const companyId = req.query.companyId || req.user?.companyId;

    if (!companyId) {
      throw new AppError('Company ID required', 400);
    }

    // Validate customer/supplier
    if (data.invoiceType === 'SALES' && !data.customerId) {
      throw new AppError('Customer required for sales invoice', 400);
    }
    if (data.invoiceType === 'PURCHASE' && !data.supplierId) {
      throw new AppError('Supplier required for purchase invoice', 400);
    }

    // Calculate totals
    let subtotal = 0;
    let totalTax = 0;
    const invoiceItems = [];

    for (const item of data.items) {
      const itemData = await prisma.item.findUnique({
        where: { id: item.itemId },
      });

      if (!itemData) {
        throw new AppError(`Item not found: ${item.itemId}`, 404);
      }

      const qty = item.quantity;
      const price = item.unitPrice;
      const discountPct = item.discountPercent || 0;
      const taxRate = item.taxRate ?? Number(itemData.taxRate);

      const itemSubtotal = qty * price;
      const discountAmount = itemSubtotal * (discountPct / 100);
      const taxableAmount = itemSubtotal - discountAmount;
      const taxAmount = taxableAmount * (taxRate / 100);
      const totalAmount = taxableAmount + taxAmount;

      subtotal += itemSubtotal;
      totalTax += taxAmount;

      invoiceItems.push({
        itemId: item.itemId,
        description: item.description || itemData.name,
        quantity: qty,
        unitPrice: price,
        discountPercent: discountPct,
        discountAmount,
        taxRate,
        taxAmount,
        totalAmount,
      });
    }

    const discountAmount = data.discountAmount || 0;
    const totalAmount = subtotal - discountAmount + totalTax;

    // Get sequence number
    const count = await prisma.invoice.count({ where: { companyId } });
    const prefix = data.invoiceType === 'SALES' ? 'INV' : data.invoiceType === 'PURCHASE' ? 'PINV' : 'CN';
    const invoiceNumber = generateInvoiceNumber(prefix, count + 1);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        invoiceDate: new Date(data.invoiceDate),
        dueDate: new Date(data.dueDate),
        invoiceType: data.invoiceType,
        customerId: data.customerId,
        supplierId: data.supplierId,
        subtotal,
        discountAmount,
        taxAmount: totalTax,
        totalAmount,
        balanceDue: totalAmount,
        notes: data.notes,
        terms: data.terms,
        companyId,
        createdById: req.user.userId,
        items: {
          create: invoiceItems,
        },
      },
      include: {
        items: { include: { item: true } },
        customer: true,
        supplier: true,
      },
    });

    // Update customer/supplier balance
    if (data.customerId) {
      await prisma.customer.update({
        where: { id: data.customerId },
        data: { currentBalance: { increment: totalAmount } },
      });
    }
    if (data.supplierId) {
      await prisma.supplier.update({
        where: { id: data.supplierId },
        data: { currentBalance: { increment: totalAmount } },
      });
    }

    res.status(201).json(successResponse(invoice, 'Invoice created successfully'));
  } catch (error) {
    next(error);
  }
};

export const getInvoices = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.query.companyId;
    const type = req.query.type;
    const status = req.query.status;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (type) where.invoiceType = type;
    if (status) where.status = status;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true } },
          supplier: { select: { name: true } },
          _count: { select: { items: true, payments: true } },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json(successResponse(invoices, 'Invoices retrieved', {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }));
  } catch (error) {
    next(error);
  }
};

export const getInvoice = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: { include: { item: true } },
        customer: true,
        supplier: true,
        payments: true,
      },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    res.json(successResponse(invoice));
  } catch (error) {
    next(error);
  }
};

export const updateInvoice = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { items: _items, ...data } = invoiceSchema.partial().parse(req.body);
    // Note: line items are not updated here - editing invoice items requires
    // recalculating totals and should go through a dedicated endpoint/service.

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...data,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });

    res.json(successResponse(invoice, 'Invoice updated'));
  } catch (error) {
    next(error);
  }
};

export const submitInvoice = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status: 'SUBMITTED' },
    });

    res.json(successResponse(invoice, 'Invoice submitted'));
  } catch (error) {
    next(error);
  }
};

export const cancelInvoice = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // Reverse customer/supplier balance
    if (invoice.customerId) {
      await prisma.customer.update({
        where: { id: invoice.customerId },
        data: { currentBalance: { decrement: invoice.totalAmount } },
      });
    }
    if (invoice.supplierId) {
      await prisma.supplier.update({
        where: { id: invoice.supplierId },
        data: { currentBalance: { decrement: invoice.totalAmount } },
      });
    }

    res.json(successResponse(invoice, 'Invoice cancelled'));
  } catch (error) {
    next(error);
  }
};
