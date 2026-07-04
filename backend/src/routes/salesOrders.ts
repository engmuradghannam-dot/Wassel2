import { Router } from 'express';
import {
  createSalesOrder, getSalesOrders, getSalesOrder,
  submitSalesOrder, cancelSalesOrder,
} from '../controllers/salesOrder';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.post('/', createSalesOrder);
router.get('/', getSalesOrders);
router.get('/:id', getSalesOrder);
router.post('/:id/submit', submitSalesOrder);
router.post('/:id/cancel', cancelSalesOrder);

export default router;
