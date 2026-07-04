import { Router } from 'express';
import { createAttendance, getAttendance } from '../controllers/hr';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.post('/', createAttendance);
router.get('/', getAttendance);

export default router;
