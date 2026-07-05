import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getNotifications, markAsRead, markAllAsRead, deleteNotification, createNotification,
} from '../controllers/notification';

const router = Router();
router.use(authenticate);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);
router.post('/', createNotification);

export default router;
