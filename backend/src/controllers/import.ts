import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const importSchema = z.object({
  data: z.array(z.record(z.any())),
  entityType: z.enum(['CUSTOMER', 'SUPPLIER', 'ITEM', 'EMPLOYEE', 'ACCOUNT']),
  mapping: z.record(z.string()),
});

export const importData = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { data, entityType, mapping } = importSchema.parse(req.body);
    const companyId = req.companyId!;
    const userId = req.user.userId;

    const results = { created: 0, updated: 0, failed: 0, errors: [] as string[] };

    for (const row of data) {
      try {
        const mappedData: any = {};
        for (const [key, value] of Object.entries(mapping)) {
          mappedData[value] = row[key];
        }

        switch (entityType) {
          case 'CUSTOMER':
            await prisma.customer.create({ data: { ...mappedData, companyId, status: 'ACTIVE' } });
            break;
          case 'SUPPLIER':
            await prisma.supplier.create({ data: { ...mappedData, companyId, status: 'ACTIVE' } });
            break;
          case 'ITEM':
            await prisma.item.create({ data: { ...mappedData, companyId, status: 'ACTIVE' } });
            break;
          case 'EMPLOYEE':
            await prisma.employee.create({ data: { ...mappedData, companyId, status: 'ACTIVE' } });
            break;
          case 'ACCOUNT':
            await prisma.account.create({ data: { ...mappedData, companyId, status: 'ACTIVE' } });
            break;
        }
        results.created++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(`Row ${results.created + results.failed + results.updated}: ${err.message}`);
      }
    }

    await prisma.dataImportLog.create({
      data: {
        companyId,
        userId,
        entityType,
        totalRecords: data.length,
        successCount: results.created,
        failedCount: results.failed,
        errors: results.errors,
      },
    });

    res.json(successResponse(results, 'Import completed'));
  } catch (error) {
    next(error);
  }
};

export const getImportLogs = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const logs = await prisma.dataImportLog.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(successResponse(logs));
  } catch (error) {
    next(error);
  }
};

export const getImportTemplate = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { entityType } = req.params;
    const templates: Record<string, string[]> = {
      CUSTOMER: ['name', 'email', 'phone', 'taxId', 'address', 'city', 'country'],
      SUPPLIER: ['name', 'email', 'phone', 'taxId', 'address', 'paymentTerms'],
      ITEM: ['name', 'itemCode', 'description', 'unitPrice', 'costPrice', 'uom', 'category'],
      EMPLOYEE: ['firstName', 'lastName', 'email', 'phone', 'department', 'designation', 'joinDate'],
      ACCOUNT: ['name', 'accountCode', 'accountType', 'parentAccountId', 'isGroup'],
    };
    res.json(successResponse({ entityType, columns: templates[entityType] || [] }));
  } catch (error) {
    next(error);
  }
};
