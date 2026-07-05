import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { buildZatcaTlvBase64 } from '../utils/zatca';
import QRCode from 'qrcode';

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
    const companyId = req.companyId!;

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

    // Generate ZATCA Phase 1 QR for sales invoices (Saudi e-invoicing compliance)
    let zatcaQrCode: string | undefined;
    if (data.invoiceType === 'SALES') {
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      if (company) {
        zatcaQrCode = buildZatcaTlvBase64({
          sellerName: company.name,
          vatNumber: company.taxId || '',
          timestamp: new Date(data.invoiceDate),
          invoiceTotal: totalAmount,
          vatTotal: totalTax,
        });
      }
    }

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
        zatcaQrCode,
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
    const companyId = req.companyId!;
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

// Returns the ZATCA QR as a scannable PNG data URL for a sales invoice.
export const getInvoiceZatcaQr = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new AppError('Invoice not found', 404);
    if (!invoice.zatcaQrCode) {
      throw new AppError('This invoice has no ZATCA QR code (only sales invoices are compliance-tagged)', 400);
    }

    const dataUrl = await QRCode.toDataURL(invoice.zatcaQrCode, { width: 256, margin: 1 });

    res.json(successResponse({ qrDataUrl: dataUrl, tlvBase64: invoice.zatcaQrCode }));
  } catch (error) {
    next(error);
  }
};

// Three-way matching: compares a purchase invoice against its linked
// Purchase Order and any Purchase Receipts (GRNs) raised against that PO,
// checking that quantities and amounts line up within tolerance before the
// invoice can be considered safe to pay.
export const matchThreeWay = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const tolerancePercent = Number(req.query.tolerance) || 2;

    const invoice = await prisma.invoice.findFirst({
      where: { id, companyId },
      include: { items: true, purchaseOrder: { include: { items: true } } },
    });
    if (!invoice) throw new AppError('Invoice not found', 404);
    if (!invoice.purchaseOrderId || !invoice.purchaseOrder) {
      await prisma.invoice.update({ where: { id }, data: { matchStatus: 'UNMATCHED' } });
      return res.json(successResponse({ matchStatus: 'UNMATCHED', reason: 'No linked purchase order' }));
    }

    const receipts = await prisma.purchaseReceipt.findMany({
      where: { companyId, purchaseOrderId: invoice.purchaseOrderId },
      include: { items: true },
    });

    const discrepancies: any[] = [];

    for (const poItem of invoice.purchaseOrder.items) {
      const invoiceLine = invoice.items.find((i) => i.itemId === poItem.itemId);
      const receivedQty = receipts
        .flatMap((r) => r.items)
        .filter((ri) => ri.itemId === poItem.itemId)
        .reduce((sum, ri) => sum + Number(ri.quantity), 0);

      if (!invoiceLine) {
        discrepancies.push({ itemId: poItem.itemId, issue: 'Invoiced but not on invoice line items' });
        continue;
      }

      const invoicedQty = Number(invoiceLine.quantity);
      const orderedQty = Number(poItem.quantity);

      if (receivedQty === 0) {
        discrepancies.push({ itemId: poItem.itemId, issue: 'No goods receipt found for this item', orderedQty, invoicedQty, receivedQty });
        continue;
      }

      const qtyDiffPercent = Math.abs(invoicedQty - receivedQty) / receivedQty * 100;
      if (qtyDiffPercent > tolerancePercent) {
        discrepancies.push({
          itemId: poItem.itemId,
          issue: `Invoiced quantity (${invoicedQty}) differs from received quantity (${receivedQty}) by more than ${tolerancePercent}%`,
          orderedQty, invoicedQty, receivedQty,
        });
      }

      const priceDiffPercent = Math.abs(Number(invoiceLine.unitPrice) - Number(poItem.unitPrice)) / Number(poItem.unitPrice) * 100;
      if (priceDiffPercent > tolerancePercent) {
        discrepancies.push({
          itemId: poItem.itemId,
          issue: `Invoiced unit price (${invoiceLine.unitPrice}) differs from PO price (${poItem.unitPrice}) by more than ${tolerancePercent}%`,
        });
      }
    }

    const matchStatus = discrepancies.length === 0 ? 'MATCHED' : (discrepancies.length < invoice.purchaseOrder.items.length ? 'PARTIAL' : 'MISMATCH');

    const updated = await prisma.invoice.update({ where: { id }, data: { matchStatus } });

    res.json(successResponse({ matchStatus: updated.matchStatus, discrepancies }));
  } catch (error) {
    next(error);
  }
};
