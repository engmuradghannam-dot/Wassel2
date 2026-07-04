import { Router } from 'express';
import { createPayment, getPayments } from '../controllers/payment';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/', createPayment);
router.get('/', getPayments);

export default router;
