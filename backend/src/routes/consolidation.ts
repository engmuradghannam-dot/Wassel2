import { Router } from 'express';
import { setParentCompany, getGroupStructure, getConsolidatedBalanceSheet } from '../controllers/consolidation';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.put('/:id/parent', setParentCompany);
router.get('/:id/group', getGroupStructure);
router.post('/:id/balance-sheet', getConsolidatedBalanceSheet);

export default router;
