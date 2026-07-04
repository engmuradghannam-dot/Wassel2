import { Router } from 'express';
import { createPerformanceReview, getPerformanceReviews } from '../controllers/hr';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/', createPerformanceReview);
router.get('/', getPerformanceReviews);

export default router;
