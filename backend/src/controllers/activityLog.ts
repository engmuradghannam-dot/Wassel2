import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';

export const getActivityLogs = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { userId, entityType, action, startDate, endDate, page = 1, limit = 20 } = req.query;

    const where: any = { companyId };
    if (userId) where.userId = userId as string;
    if (entityType) where.entityType = entityType as string;
    if (action) where.action = { contains: action as string, mode: 'insensitive' };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json(successResponse(logs, 'Activity logs retrieved', {
      page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)),
    }));
  } catch (error) {
    next(error);
  }
};

export const getUserActivity = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const logs = await prisma.auditLog.findMany({
      where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 50,
    });
    res.json(successResponse(logs));
  } catch (error) {
    next(error);
  }
};

export const logActivity = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { action, entityType, entityId, details, companyId } = req.body;
    const log = await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        companyId: companyId || req.companyId,
        action, entityType, entityId,
        details: details || {},
      },
    });
    res.status(201).json(successResponse(log, 'Activity logged'));
  } catch (error) {
    next(error);
  }
};
