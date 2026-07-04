import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const issueSchema = z.object({
  subject: z.string().min(2),
  description: z.string().optional(),
  issueType: z.string().default('Technical'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  customerId: z.string().optional(),
  assignedToId: z.string().optional(),
});

function generateNumber(prefix: string, sequence: number): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${prefix}-${year}${month}-${String(sequence).padStart(5, '0')}`;
}

export const createIssue = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = issueSchema.parse(req.body);
    const companyId = req.companyId!;

    const count = await prisma.issue.count({ where: { companyId } });
    const issueNumber = generateNumber('ISS', count + 1);

    const issue = await prisma.issue.create({
      data: { ...data, issueNumber, companyId, createdById: req.user.userId },
    });

    res.status(201).json(successResponse(issue, 'Issue created'));
  } catch (error) {
    next(error);
  }
};

export const getIssues = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const status = req.query.status as string | undefined;

    const issues = await prisma.issue.findMany({
      where: { companyId, ...(status ? { status: status as any } : {}) },
      orderBy: { createdAt: 'desc' },
    });

    res.json(successResponse(issues));
  } catch (error) {
    next(error);
  }
};

export const getIssue = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { id } = req.params;
    const issue = await prisma.issue.findFirst({ where: { id, companyId } });
    if (!issue) throw new AppError('Issue not found', 404);
    res.json(successResponse(issue));
  } catch (error) {
    next(error);
  }
};

export const updateIssue = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { id } = req.params;
    const data = z.object({
      status: z.enum(['OPEN', 'REPLIED', 'ON_HOLD', 'RESOLVED', 'CLOSED']).optional(),
      resolution: z.string().optional(),
      assignedToId: z.string().optional(),
    }).parse(req.body);

    const existing = await prisma.issue.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError('Issue not found', 404);

    const issue = await prisma.issue.update({
      where: { id },
      data: {
        ...data,
        resolutionDate: data.status === 'RESOLVED' || data.status === 'CLOSED' ? new Date() : undefined,
      },
    });

    res.json(successResponse(issue, 'Issue updated'));
  } catch (error) {
    next(error);
  }
};
