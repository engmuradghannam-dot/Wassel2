import { Router } from 'express';
import { createBranch, getBranches, getBranch, updateBranch, deleteBranch } from '../controllers/branch';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/', createBranch);
router.get('/', getBranches);
router.get('/:id', getBranch);
router.put('/:id', updateBranch);
router.delete('/:id', deleteBranch);

export default router;
