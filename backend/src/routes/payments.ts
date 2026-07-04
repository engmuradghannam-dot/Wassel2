import { Router } from 'express';
import { createPayment, getPayments } from '../controllers/payment';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.post('/', createPayment);
router.get('/', getPayments);

export default router;
