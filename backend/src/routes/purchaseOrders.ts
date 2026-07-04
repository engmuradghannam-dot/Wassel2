import { Router } from 'express';
import {
  createPurchaseOrder, getPurchaseOrders, getPurchaseOrder,
  submitPurchaseOrder, cancelPurchaseOrder,
} from '../controllers/purchaseOrder';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/', createPurchaseOrder);
router.get('/', getPurchaseOrders);
router.get('/:id', getPurchaseOrder);
router.post('/:id/submit', submitPurchaseOrder);
router.post('/:id/cancel', cancelPurchaseOrder);

export default router;
