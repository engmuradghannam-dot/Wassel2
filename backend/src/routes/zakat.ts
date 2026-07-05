import { Router } from 'express';
import { authenticate, resolveCompany } from '../middleware/auth';
import { calculateZakat, getZakatHistory, getZakatReport } from '../controllers/zakat';

const router = Router();
router.use(authenticate, resolveCompany);

router.post('/calculate', calculateZakat);
router.get('/history', getZakatHistory);
router.get('/report/:year', getZakatReport);

export default router;
