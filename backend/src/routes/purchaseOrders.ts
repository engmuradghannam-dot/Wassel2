import { Router } from 'express';
import {
  createPurchaseOrder, getPurchaseOrders, getPurchaseOrder,
  submitPurchaseOrder, cancelPurchaseOrder,
} from '../controllers/purchaseOrder';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.post('/', createPurchaseOrder);
router.get('/', getPurchaseOrders);
router.get('/:id', getPurchaseOrder);
router.post('/:id/submit', submitPurchaseOrder);
router.post('/:id/cancel', cancelPurchaseOrder);

export default router;
