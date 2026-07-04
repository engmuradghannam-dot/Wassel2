import { Router } from 'express';
import {
  createMaintenanceSchedule, getMaintenanceSchedules,
  createMaintenanceVisit, completeMaintenanceVisit,
} from '../controllers/maintenance';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/schedules', createMaintenanceSchedule);
router.get('/schedules', getMaintenanceSchedules);
router.post('/visits', createMaintenanceVisit);
router.put('/visits/:id/complete', completeMaintenanceVisit);

export default router;
