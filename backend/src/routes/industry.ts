import { Router } from 'express';
import {
  getAllIndustries,
  getIndustryById,
  getIndustryControls,
  getIndustryAIAgents,
  getAllEntities,
  createPMOProject,
  getPMOProjects,
  getPMOProjectById,
  updatePMOProject,
  deletePMOProject,
  addMilestone,
  addRisk,
  addIssue,
  addBudgetItem,
  addStakeholder,
} from '../controllers/industry';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();

// ─── Industry Catalog (Public/Authenticated) ───
router.get('/catalog', authenticate, getAllIndustries);
router.get('/catalog/:id', authenticate, getIndustryById);
router.get('/catalog/:industryId/controls', authenticate, getIndustryControls);
router.get('/catalog/:industryId/agents', authenticate, getIndustryAIAgents);
router.get('/entities', authenticate, getAllEntities);

// ─── PMO Projects ───
router.post('/pmo/projects', authenticate, resolveCompany, createPMOProject);
router.get('/pmo/projects', authenticate, resolveCompany, getPMOProjects);
router.get('/pmo/projects/:id', authenticate, getPMOProjectById);
router.put('/pmo/projects/:id', authenticate, updatePMOProject);
router.delete('/pmo/projects/:id', authenticate, deletePMOProject);

// ─── PMO Sub-modules ───
router.post('/pmo/milestones', authenticate, addMilestone);
router.post('/pmo/risks', authenticate, addRisk);
router.post('/pmo/issues', authenticate, addIssue);
router.post('/pmo/budget', authenticate, addBudgetItem);
router.post('/pmo/stakeholders', authenticate, addStakeholder);

export default router;
