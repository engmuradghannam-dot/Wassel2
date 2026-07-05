import { Router } from 'express';
import { generateForecast, getForecasts } from '../controllers/salesForecast';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/generate', generateForecast);
router.get('/', getForecasts);

export default router;
