import { Router } from 'express';
import { createRfq, getRfqs, getRfq, updateRfqStatus } from '../controllers/rfq';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/', createRfq);
router.get('/', getRfqs);
router.get('/:id', getRfq);
router.put('/:id/status', updateRfqStatus);

export default router;
