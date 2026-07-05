import { Router } from 'express';
import { runMRP, getMRPRuns, getMRPRun, convertPlannedOrder } from '../controllers/mrp';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/run', runMRP);
router.get('/runs', getMRPRuns);
router.get('/runs/:id', getMRPRun);
router.post('/planned-orders/:id/convert', convertPlannedOrder);

export default router;
