import { Router } from 'express';
import { createLeave, getLeaves, updateLeaveStatus } from '../controllers/hr';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.post('/', createLeave);
router.get('/', getLeaves);
router.put('/:id/status', updateLeaveStatus);

export default router;
