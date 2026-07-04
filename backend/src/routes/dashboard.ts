import { Router } from 'express';
import { getDashboardStats, getNotifications, markNotificationRead } from '../controllers/dashboard';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(resolveCompany);

router.get('/stats', getDashboardStats);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);

export default router;
