import { Router } from 'express';
import { createAttendance, getAttendance } from '../controllers/hr';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/', createAttendance);
router.get('/', getAttendance);

export default router;
