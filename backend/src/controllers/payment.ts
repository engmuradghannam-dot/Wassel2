import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const paymentSchema = z.object({
  invoiceId: z.string(),
  paymentDate: z.string().datetime(),
  paymentType: z.enum(['RECEIVE', 'PAY']),
  paymentMode: z.enum(['CASH', 'BANK_TRANSFER', 'CHECK']),
  amount: z.number().positive(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

function generatePaymentNumber(sequence: number): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `PMT-${year}${month}-${String(sequence).padStart(5, '0')}`;
}

export const createPayment = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = paymentSchema.parse(req.body);

    const invoice = await prisma.invoice.findUnique({ where: { id: data.invoiceId } });
    if (!invoice) throw new AppError('Invoice not found', 404);
    if (data.amount > Number(invoice.balanceDue)) {
      throw new AppError('Payment amount exceeds remaining balance due', 400);
    }

    const count = await prisma.payment.count();
    const paymentNumber = generatePaymentNumber(count + 1);

    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          paymentNumber,
          paymentDate: new Date(data.paymentDate),
          paymentType: data.paymentType,
          paymentMode: data.paymentMode,
          amount: data.amount,
          reference: data.reference,
          notes: data.notes,
          invoiceId: data.invoiceId,
        },
      }),
      prisma.invoice.update({
        where: { id: data.invoiceId },
        data: {
          paidAmount: { increment: data.amount },
          balanceDue: { decrement: data.amount },
          paymentStatus:
            data.amount >= Number(invoice.balanceDue) ? 'PAID' : 'PARTIAL',
        },
      }),
    ]);

    res.status(201).json(successResponse(payment, 'Payment recorded'));
  } catch (error) {
    next(error);
  }
};

export const getPayments = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.query.companyId || req.user?.companyId;
    if (!companyId) throw new AppError('Company ID required', 400);

    const payments = await prisma.payment.findMany({
      where: { invoice: { companyId } },
      include: {
        invoice: {
          select: { invoiceNumber: true, customer: { select: { name: true } }, supplier: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(successResponse(payments));
  } catch (error) {
    next(error);
  }
};
