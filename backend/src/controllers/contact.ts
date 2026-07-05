import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const contactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  designation: z.string().optional(),
  department: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  isPrimary: z.boolean().default(false),
  notes: z.string().optional(),
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
});

// Ensures the referenced customer/supplier actually belongs to the caller's
// company before we let them attach a contact to it (prevents IDOR).
async function assertPartyInCompany(companyId: string, customerId?: string, supplierId?: string) {
  if (!customerId && !supplierId) {
    throw new AppError('Either customerId or supplierId is required', 400);
  }
  if (customerId) {
    const customer = await prisma.customer.findFirst({ where: { id: customerId, companyId } });
    if (!customer) throw new AppError('Customer not found', 404);
  }
  if (supplierId) {
    const supplier = await prisma.supplier.findFirst({ where: { id: supplierId, companyId } });
    if (!supplier) throw new AppError('Supplier not found', 404);
  }
}

export const createContact = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = contactSchema.parse(req.body);
    const companyId = req.companyId!;
    await assertPartyInCompany(companyId, data.customerId, data.supplierId);

    const contact = await prisma.contact.create({
      data: { ...data, companyId },
    });

    res.status(201).json(successResponse(contact, 'Contact created'));
  } catch (error) {
    next(error);
  }
};

export const getContacts = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { customerId, supplierId } = req.query;

    const where: any = { companyId };
    if (customerId) where.customerId = customerId as string;
    if (supplierId) where.supplierId = supplierId as string;

    const contacts = await prisma.contact.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(successResponse(contacts));
  } catch (error) {
    next(error);
  }
};

export const getContact = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const contact = await prisma.contact.findFirst({ where: { id, companyId } });
    if (!contact) throw new AppError('Contact not found', 404);
    res.json(successResponse(contact));
  } catch (error) {
    next(error);
  }
};

export const updateContact = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const existing = await prisma.contact.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Contact not found', 404);

    const data = contactSchema.partial().parse(req.body);
    if (data.customerId || data.supplierId) {
      await assertPartyInCompany(companyId, data.customerId, data.supplierId);
    }

    const contact = await prisma.contact.update({ where: { id }, data });
    res.json(successResponse(contact, 'Contact updated'));
  } catch (error) {
    next(error);
  }
};

export const deleteContact = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;
    const existing = await prisma.contact.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Contact not found', 404);

    await prisma.contact.delete({ where: { id } });
    res.json(successResponse(null, 'Contact deleted'));
  } catch (error) {
    next(error);
  }
};
