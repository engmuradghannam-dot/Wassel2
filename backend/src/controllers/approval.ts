import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const workflowSchema = z.object({
  name: z.string().min(2),
  documentType: z.string().min(1),
  states: z.array(z.object({
    state: z.string(),
    style: z.string().optional(),
  })),
  transitions: z.array(z.object({
    state: z.string(),
    action: z.string(),
    nextState: z.string(),
    allowedRoles: z.array(z.string()).optional(),
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
        workflowName: data.name,
        doctype: data.documentType,
        companyId,
        isActive: true,
        states: {
          create: data.states.map((s) => ({
            state: s.state,
            style: s.style || 'Info',
          })),
        },
        transitions: {
          create: data.transitions.map((t) => ({
            state: t.state,
            action: t.action,
            nextState: t.nextState,
            allowedRoles: t.allowedRoles || [],
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
      where: { id: workflowId, companyId, doctype: documentType },
      include: { states: true },
    });
    if (!workflow) throw new AppError('Workflow not found', 404);
    if (workflow.states.length === 0) throw new AppError('Workflow has no states', 400);

    const startState = workflow.states[0];

    const notification = await prisma.notification.create({
      data: {
        userId,
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
    const companyId = req.companyId!;

    await prisma.auditLog.create({
      data: {
        userId,
        companyId,
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
      where: { userId, type: 'APPROVAL', isRead: false },
      orderBy: { createdAt: 'desc' },
    });
    res.json(successResponse(notifications));
  } catch (error) {
    next(error);
  }
};
