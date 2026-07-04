import { Router } from 'express';
import { createPayroll, getPayrolls, markPayrollPaid, getEndOfServiceEstimate } from '../controllers/hr';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.post('/', createPayroll);
router.get('/', getPayrolls);
router.post('/:id/mark-paid', markPayrollPaid);
router.get('/end-of-service/:employeeId', getEndOfServiceEstimate);

export default router;
