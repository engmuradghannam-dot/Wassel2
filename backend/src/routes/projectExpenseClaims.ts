import { Router } from 'express';
import {
  createProjectExpenseClaim, getProjectExpenseClaims, updateProjectExpenseClaimStatus,
} from '../controllers/project';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/', createProjectExpenseClaim);
router.get('/', getProjectExpenseClaims);
router.put('/:id/status', updateProjectExpenseClaimStatus);

export default router;
