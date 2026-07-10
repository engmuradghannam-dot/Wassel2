import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

// ─── Industry Catalog ───

export const getAllIndustries = async (req: any, res: Response, next: NextFunction) => {
  try {
    const industries = await prisma.industryCatalog.findMany({
      include: {
        controls: true,
        aiAgents: true,
      },
      orderBy: { name: 'asc' },
    });
    res.json(successResponse(industries));
  } catch (error) {
    next(error);
  }
};

export const getIndustryById = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const industry = await prisma.industryCatalog.findUnique({
      where: { industryId: id },
      include: {
        controls: true,
        aiAgents: true,
      },
    });
    if (!industry) throw new AppError('Industry not found', 404);
    res.json(successResponse(industry));
  } catch (error) {
    next(error);
  }
};

export const getIndustryControls = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { industryId } = req.params;
    const controls = await prisma.industryControl.findMany({
      where: { industryId },
      orderBy: { controlId: 'asc' },
    });
    res.json(successResponse(controls));
  } catch (error) {
    next(error);
  }
};

export const getIndustryAIAgents = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { industryId } = req.params;
    const agents = await prisma.aIAgent.findMany({
      where: { industryId },
    });
    res.json(successResponse(agents));
  } catch (error) {
    next(error);
  }
};

export const getAllEntities = async (req: any, res: Response, next: NextFunction) => {
  try {
    const entities = await prisma.entityMaster.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(successResponse(entities));
  } catch (error) {
    next(error);
  }
};

// ─── PMO Project Management ───

const projectSchema = z.object({
  projectCode: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional(),
  status: z.string().default('DRAFT'),
  priority: z.string().default('MEDIUM'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.number().optional(),
  notes: z.string().optional(),
});

export const createPMOProject = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = projectSchema.parse(req.body);
    const companyId = req.companyId || req.user.companyId;

    const project = await prisma.pMOProject.create({
      data: {
        ...data,
        companyId,
        ownerId: req.user.userId,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        company: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(successResponse(project, 'PMO Project created'));
  } catch (error) {
    next(error);
  }
};

export const getPMOProjects = async (req: any, res: Response, next: NextFunction) => {
  try {
    const companyId = req.companyId || req.user.companyId;
    const projects = await prisma.pMOProject.findMany({
      where: { companyId },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: {
          select: {
            milestones: true,
            risks: true,
            issues: true,
            stakeholders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(successResponse(projects));
  } catch (error) {
    next(error);
  }
};

export const getPMOProjectById = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const project = await prisma.pMOProject.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        company: { select: { id: true, name: true } },
        charter: true,
        stakeholders: true,
        requirements: true,
        wbsItems: true,
        deliverables: true,
        milestones: true,
        scheduleItems: true,
        sprints: true,
        kanbanItems: true,
        resources: true,
        raciEntries: true,
        budgetItems: true,
        costTrackings: true,
        procurements: true,
        vendors: true,
        contracts: true,
        payments: true,
        risks: true,
        issues: true,
        changeRequests: true,
        decisions: true,
        qualityPlans: true,
        qaChecklists: true,
        testCases: true,
        bugs: true,
        uatItems: true,
        kpis: true,
        weeklyReports: true,
        monthlyReports: true,
        execReports: true,
        lessonsLearned: true,
        meetingMinutes: true,
        actionItems: true,
        raidLogs: true,
        dependencies: true,
        commPlans: true,
        docRegisters: true,
        versionControls: true,
        trainingPlans: true,
        goLivePlans: true,
        maintenances: true,
        closureDocs: true,
      },
    });

    if (!project) throw new AppError('Project not found', 404);
    res.json(successResponse(project));
  } catch (error) {
    next(error);
  }
};

export const updatePMOProject = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = projectSchema.partial().parse(req.body);

    const project = await prisma.pMOProject.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });

    res.json(successResponse(project, 'PMO Project updated'));
  } catch (error) {
    next(error);
  }
};

export const deletePMOProject = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.pMOProject.delete({ where: { id } });
    res.json(successResponse(null, 'PMO Project deleted'));
  } catch (error) {
    next(error);
  }
};

// ─── PMO Sub-modules ───

// Milestones
export const addMilestone = async (req: any, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      projectId: z.string(),
      name: z.string(),
      description: z.string().optional(),
      targetDate: z.string().datetime(),
    });
    const data = schema.parse(req.body);

    const milestone = await prisma.projectMilestone.create({
      data: {
        ...data,
        targetDate: new Date(data.targetDate),
      },
    });
    res.status(201).json(successResponse(milestone));
  } catch (error) {
    next(error);
  }
};

// Risks
export const addRisk = async (req: any, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      projectId: z.string(),
      riskCode: z.string(),
      description: z.string(),
      category: z.string().optional(),
      probability: z.number().min(1).max(5).default(3),
      impact: z.number().min(1).max(5).default(3),
      mitigation: z.string().optional(),
      owner: z.string().optional(),
    });
    const data = schema.parse(req.body);

    const risk = await prisma.riskRegister.create({
      data: {
        ...data,
        score: data.probability * data.impact,
      },
    });
    res.status(201).json(successResponse(risk));
  } catch (error) {
    next(error);
  }
};

// Issues
export const addIssue = async (req: any, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      projectId: z.string(),
      issueCode: z.string(),
      title: z.string(),
      description: z.string().optional(),
      severity: z.string().default('MEDIUM'),
      assignedTo: z.string().optional(),
    });
    const data = schema.parse(req.body);

    const issue = await prisma.issueLog.create({ data });
    res.status(201).json(successResponse(issue));
  } catch (error) {
    next(error);
  }
};

// Budget
export const addBudgetItem = async (req: any, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      projectId: z.string(),
      category: z.string(),
      itemName: z.string(),
      plannedAmount: z.number(),
    });
    const data = schema.parse(req.body);

    const item = await prisma.budgetItem.create({ data });
    res.status(201).json(successResponse(item));
  } catch (error) {
    next(error);
  }
};

// Stakeholders
export const addStakeholder = async (req: any, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      projectId: z.string(),
      name: z.string(),
      role: z.string().optional(),
      influence: z.string().optional(),
      interest: z.string().optional(),
      email: z.string().optional(),
    });
    const data = schema.parse(req.body);

    const stakeholder = await prisma.projectStakeholder.create({ data });
    res.status(201).json(successResponse(stakeholder));
  } catch (error) {
    next(error);
  }
};
