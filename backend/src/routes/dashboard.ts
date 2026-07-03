import { Router } from 'express';
import { getDashboardStats, getNotifications, markNotificationRead } from '../controllers/dashboard';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);

export default router;
