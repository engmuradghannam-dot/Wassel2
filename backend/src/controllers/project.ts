import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

function generateCode(prefix: string) {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}${rand}`;
}

// ==================== Projects ====================

const projectSchema = z.object({
  projectCode: z.string().optional(),
  name: z.string().min(2),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  estimatedCost: z.number().min(0).default(0),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('PLANNING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

export const createProject = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = projectSchema.parse(req.body);
    const companyId = req.query.companyId || req.user?.companyId;
    if (!companyId) throw new AppError('Company ID required', 400);

    const project = await prisma.project.create({
      data: {
        ...data,
        projectCode: data.projectCode || generateCode('PRJ'),
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        companyId,
        createdById: req.user.userId,
      },
    });

    res.status(201).json(successResponse(project, 'Project created'));
  } catch (error: any) {
    if (error?.code === 'P2002') return next(new AppError('Project code already exists', 409));
    next(error);
  }
};

export const getProjects = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.query.companyId || req.user?.companyId;
    if (!companyId) throw new AppError('Company ID required', 400);

    const projects = await prisma.project.findMany({
      where: { companyId },
      include: { _count: { select: { tasks: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(successResponse(projects));
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = projectSchema.partial().parse(req.body);
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
    res.json(successResponse(project, 'Project updated'));
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.project.update({ where: { id }, data: { status: 'CANCELLED' } });
    res.json(successResponse(null, 'Project cancelled'));
  } catch (error) {
    next(error);
  }
};

// ==================== Tasks ====================

const taskSchema = z.object({
  taskCode: z.string().optional(),
  title: z.string().min(2),
  description: z.string().optional(),
  projectId: z.string(),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  estimatedHours: z.number().min(0).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

export const createTask = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = taskSchema.parse(req.body);

    const task = await prisma.task.create({
      data: {
        ...data,
        taskCode: data.taskCode || generateCode('TSK'),
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });

    res.status(201).json(successResponse(task, 'Task created'));
  } catch (error: any) {
    if (error?.code === 'P2002') return next(new AppError('Task code already exists', 409));
    next(error);
  }
};

export const getTasks = async (req: any, res: Response, next: NextFunction) => {
  try {
    const projectId = req.query.projectId as string | undefined;
    const companyId = req.query.companyId || req.user?.companyId;
    if (!companyId) throw new AppError('Company ID required', 400);

    const tasks = await prisma.task.findMany({
      where: {
        project: { companyId },
        ...(projectId ? { projectId } : {}),
      },
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(successResponse(tasks));
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = z.object({ status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']) }).parse(req.body);
    const task = await prisma.task.update({
      where: { id },
      data: { status, completedAt: status === 'DONE' ? new Date() : undefined },
    });
    res.json(successResponse(task, 'Task updated'));
  } catch (error) {
    next(error);
  }
};

// ==================== Timesheets ====================

const timesheetSchema = z.object({
  employeeId: z.string(),
  projectId: z.string(),
  date: z.string().datetime(),
  hours: z.number().positive().max(24),
  activityType: z.string().optional(),
  description: z.string().optional(),
  billable: z.boolean().default(true),
  billingRate: z.number().min(0).optional(),
});

export const createTimesheet = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = timesheetSchema.parse(req.body);
    const billingAmount = data.billable && data.billingRate ? data.hours * data.billingRate : undefined;

    const timesheet = await prisma.timesheet.create({
      data: {
        ...data,
        date: new Date(data.date),
        billingAmount,
      },
    });

    res.status(201).json(successResponse(timesheet, 'Timesheet entry created'));
  } catch (error) {
    next(error);
  }
};

export const getTimesheets = async (req: any, res: Response, next: NextFunction) => {
  try {
    const projectId = req.query.projectId as string | undefined;
    const companyId = req.query.companyId || req.user?.companyId;
    if (!companyId) throw new AppError('Company ID required', 400);

    const timesheets = await prisma.timesheet.findMany({
      where: {
        project: { companyId },
        ...(projectId ? { projectId } : {}),
      },
      include: { project: { select: { name: true } } },
      orderBy: { date: 'desc' },
    });

    res.json(successResponse(timesheets));
  } catch (error) {
    next(error);
  }
};
