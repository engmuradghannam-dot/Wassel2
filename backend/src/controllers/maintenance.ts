import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const scheduleSchema = z.object({
  itemCode: z.string().optional(),
  itemName: z.string().optional(),
  scheduleType: z.string().default('Preventive'),
  frequency: z.string(),
  nextDueDate: z.string().datetime(),
});

export const createMaintenanceSchedule = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = scheduleSchema.parse(req.body);
    const companyId = req.companyId!;

    const schedule = await prisma.maintenanceSchedule.create({
      data: { ...data, nextDueDate: new Date(data.nextDueDate), companyId },
    });

    res.status(201).json(successResponse(schedule, 'Maintenance schedule created'));
  } catch (error) {
    next(error);
  }
};

export const getMaintenanceSchedules = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const schedules = await prisma.maintenanceSchedule.findMany({
      where: { companyId },
      include: { _count: { select: { visits: true } } },
      orderBy: { nextDueDate: 'asc' },
    });
    res.json(successResponse(schedules));
  } catch (error) {
    next(error);
  }
};

const visitSchema = z.object({
  scheduleId: z.string(),
  visitDate: z.string().datetime(),
  workDone: z.string().optional(),
});

export const createMaintenanceVisit = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = visitSchema.parse(req.body);
    const companyId = req.companyId!;

    const schedule = await prisma.maintenanceSchedule.findFirst({ where: { id: data.scheduleId, companyId } });
    if (!schedule) throw new AppError('Maintenance schedule not found in this company', 404);

    const visit = await prisma.maintenanceVisit.create({
      data: { ...data, visitDate: new Date(data.visitDate) },
    });

    res.status(201).json(successResponse(visit, 'Maintenance visit logged'));
  } catch (error) {
    next(error);
  }
};

export const completeMaintenanceVisit = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const { id } = req.params;

    const existing = await prisma.maintenanceVisit.findFirst({ where: { id, schedule: { companyId } } });
    if (!existing) throw new AppError('Maintenance visit not found', 404);

    const visit = await prisma.maintenanceVisit.update({
      where: { id },
      data: { status: 'Completed', completionDate: new Date() },
    });

    res.json(successResponse(visit, 'Maintenance visit completed'));
  } catch (error) {
    next(error);
  }
};
