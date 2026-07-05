import { Router } from 'express';
import { authenticate, resolveCompany } from '../middleware/auth';
import { getActivityLogs, getUserActivity, logActivity } from '../controllers/activityLog';

const router = Router();
router.use(authenticate, resolveCompany);

router.get('/', getActivityLogs);
router.get('/user/:id', getUserActivity);
router.post('/', logActivity);

export default router;
