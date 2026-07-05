import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const workflowSchema = z.object({
  name: z.string().min(2),
  documentType: z.string().min(1),
  states: z.array(z.object({
    name: z.string(),
    isStart: z.boolean().optional(),
    isEnd: z.boolean().optional(),
  })),
  transitions: z.array(z.object({
    fromState: z.string(),
    toState: z.string(),
    requiredRole: z.string().optional(),
    condition: z.string().optional(),
  })),
});

const approvalActionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'REQUEST_CHANGE']),
  comment: z.string().optional(),
});

export const createWorkflow = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = workflowSchema.parse(req.body);
    const companyId = req.companyId!;

    const workflow = await prisma.workflow.create({
      data: {
        name: data.name,
        documentType: data.documentType,
        companyId,
        isActive: true,
        states: {
          create: data.states.map((s, i) => ({
            name: s.name,
            order: i,
            isStart: s.isStart || false,
            isEnd: s.isEnd || false,
          })),
        },
        transitions: {
          create: data.transitions.map((t, i) => ({
            fromState: t.fromState,
            toState: t.toState,
            order: i,
            requiredRole: t.requiredRole,
            condition: t.condition,
          })),
        },
      },
      include: { states: true, transitions: true },
    });

    res.status(201).json(successResponse(workflow, 'Workflow created'));
  } catch (error) {
    next(error);
  }
};

export const getWorkflows = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const workflows = await prisma.workflow.findMany({
      where: { companyId, isActive: true },
      include: { states: true, transitions: true },
    });
    res.json(successResponse(workflows));
  } catch (error) {
    next(error);
  }
};

export const submitForApproval = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { documentType, documentId, workflowId } = req.body;
    const companyId = req.companyId!;
    const userId = req.user.userId;

    const workflow = await prisma.workflow.findFirst({
      where: { id: workflowId, companyId, documentType },
      include: { states: true },
    });
    if (!workflow) throw new AppError('Workflow not found', 404);

    const startState = workflow.states.find(s => s.isStart);
    if (!startState) throw new AppError('Workflow has no start state', 400);

    const notification = await prisma.notification.create({
      data: {
        userId: workflow.createdBy || userId,
        title: `Approval Request: ${documentType}`,
        message: `Document ${documentId} is pending approval`,
        type: 'APPROVAL',
        link: `/${documentType.toLowerCase()}/${documentId}`,
      },
    });

    res.status(201).json(successResponse({ workflow, startState, notification }, 'Submitted for approval'));
  } catch (error) {
    next(error);
  }
};

export const processApproval = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { action, comment } = approvalActionSchema.parse(req.body);
    const userId = req.user.userId;

    await prisma.auditLog.create({
      data: {
        userId,
        action: `APPROVAL_${action}`,
        entityType: 'APPROVAL',
        entityId: id,
        details: { comment },
      },
    });

    res.json(successResponse({ action, comment }, `Approval ${action.toLowerCase()}ed`));
  } catch (error) {
    next(error);
  }
};

export const getPendingApprovals = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.userId;
    const notifications = await prisma.notification.findMany({
      where: { userId, type: 'APPROVAL', read: false },
      orderBy: { createdAt: 'desc' },
    });
    res.json(successResponse(notifications));
  } catch (error) {
    next(error);
  }
};
