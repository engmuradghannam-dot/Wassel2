import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

// Lead Controller
const leadSchema = z.object({
  leadName: z.string().min(2),
  companyName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'CONVERTED', 'LOST']).default('NEW'),
  notes: z.string().optional(),
  assignedToId: z.string().optional(),
});

export const createLead = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = leadSchema.parse(req.body);
    const companyId = req.companyId!;
    if (!companyId) throw new AppError('Company ID required', 400);

    const lead = await prisma.lead.create({
      data: {
        ...data,
        email: data.email || undefined,
        companyId,
        createdById: req.user.userId,
      },
    });

    res.status(201).json(successResponse(lead, 'Lead created'));
  } catch (error) {
    next(error);
  }
};

export const getLeads = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const status = req.query.status;
    const where: any = { companyId };
    if (status) where.status = status;

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(successResponse(leads));
  } catch (error) {
    next(error);
  }
};

export const updateLeadStatus = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const lead = await prisma.lead.update({
      where: { id },
      data: { status },
    });

    res.json(successResponse(lead, 'Lead status updated'));
  } catch (error) {
    next(error);
  }
};

export const convertLead = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId!;

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new AppError('Lead not found', 404);

    // Create customer from lead
    const customerCode = `CUST-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2,6).toUpperCase()}`;
    const customer = await prisma.customer.create({
      data: {
        code: customerCode,
        name: lead.leadName,
        email: lead.email,
        phone: lead.phone,
        mobile: lead.mobile,
        companyId: companyId!,
        createdById: req.user.userId,
      },
    });

    // Update lead status
    await prisma.lead.update({
      where: { id },
      data: { status: 'CONVERTED', convertedToCustomerId: customer.id },
    });

    res.json(successResponse({ lead, customer }, 'Lead converted to customer'));
  } catch (error) {
    next(error);
  }
};

// Opportunity Controller
const opportunitySchema = z.object({
  opportunityName: z.string().min(2),
  customerId: z.string().optional(),
  leadId: z.string().optional(),
  stage: z.enum(['PROSPECTING', 'QUALIFICATION', 'NEEDS_ANALYSIS', 'VALUE_PROPOSITION', 'ID_DECISION_MAKERS', 'PERCEPTION_ANALYSIS', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']).default('PROSPECTING'),
  expectedAmount: z.number().positive(),
  probability: z.number().min(0).max(100).default(0),
  expectedCloseDate: z.string().datetime(),
  description: z.string().optional(),
  assignedToId: z.string().optional(),
});

export const createOpportunity = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = opportunitySchema.parse(req.body);
    const companyId = req.companyId!;
    if (!companyId) throw new AppError('Company ID required', 400);

    const opportunity = await prisma.opportunity.create({
      data: {
        ...data,
        expectedCloseDate: new Date(data.expectedCloseDate),
        companyId,
        createdById: req.user.userId,
      },
    });

    res.status(201).json(successResponse(opportunity, 'Opportunity created'));
  } catch (error) {
    next(error);
  }
};

export const getOpportunities = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;
    const stage = req.query.stage;
    const where: any = { companyId };
    if (stage) where.stage = stage;

    const opportunities = await prisma.opportunity.findMany({
      where,
      include: { customer: true, lead: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(successResponse(opportunities));
  } catch (error) {
    next(error);
  }
};

export const updateOpportunityStage = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { stage, actualAmount } = req.body;

    const updateData: any = { stage };
    if (stage === 'CLOSED_WON' || stage === 'CLOSED_LOST') {
      updateData.actualCloseDate = new Date();
      if (actualAmount) updateData.actualAmount = actualAmount;
    }

    const opportunity = await prisma.opportunity.update({
      where: { id },
      data: updateData,
    });

    res.json(successResponse(opportunity, 'Opportunity updated'));
  } catch (error) {
    next(error);
  }
};

// CRM Dashboard
export const getCRMDashboard = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId!;

    const [leadsByStatus, opportunitiesByStage, totalPipeline] = await Promise.all([
      prisma.lead.groupBy({
        by: ['status'],
        _count: { id: true },
        where: { companyId },
      }),
      prisma.opportunity.groupBy({
        by: ['stage'],
        _count: { id: true },
        _sum: { expectedAmount: true },
        where: { companyId },
      }),
      prisma.opportunity.aggregate({
        _sum: { expectedAmount: true },
        where: { companyId, stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } },
      }),
    ]);

    res.json(successResponse({
      leadsByStatus,
      opportunitiesByStage,
      totalPipeline: totalPipeline._sum.expectedAmount || 0,
    }));
  } catch (error) {
    next(error);
  }
};
