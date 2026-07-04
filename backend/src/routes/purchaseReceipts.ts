import { Router } from 'express';
import { createPurchaseReceipt, getPurchaseReceipts, submitPurchaseReceipt } from '../controllers/purchaseReceipt';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.post('/', createPurchaseReceipt);
router.get('/', getPurchaseReceipts);
router.post('/:id/submit', submitPurchaseReceipt);

export default router;
