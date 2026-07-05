import { Router } from 'express';
import { authenticate, resolveCompany } from '../middleware/auth';
import {
  createWorkflow, getWorkflows, submitForApproval, processApproval, getPendingApprovals,
} from '../controllers/approval';

const router = Router();
router.use(authenticate, resolveCompany);

router.post('/workflows', createWorkflow);
router.get('/workflows', getWorkflows);
router.post('/submit', submitForApproval);
router.post('/:id/action', processApproval);
router.get('/pending', getPendingApprovals);

export default router;
