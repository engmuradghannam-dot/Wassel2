import { Router } from 'express';
import { createPurchaseReceipt, getPurchaseReceipts, submitPurchaseReceipt } from '../controllers/purchaseReceipt';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/', createPurchaseReceipt);
router.get('/', getPurchaseReceipts);
router.post('/:id/submit', submitPurchaseReceipt);

export default router;
