import { Router } from 'express';
import {
  createLead, getLeads, updateLeadStatus, convertLead,
  createOpportunity, getOpportunities, updateOpportunityStage,
  getCRMDashboard,
} from '../controllers/crm';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.post('/leads', createLead);
router.get('/leads', getLeads);
router.put('/leads/:id/status', updateLeadStatus);
router.post('/leads/:id/convert', convertLead);

router.post('/opportunities', createOpportunity);
router.get('/opportunities', getOpportunities);
router.put('/opportunities/:id/stage', updateOpportunityStage);

router.get('/dashboard', getCRMDashboard);

export default router;
