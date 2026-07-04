import { Router } from 'express';
import {
  createSalesOrder, getSalesOrders, getSalesOrder,
  submitSalesOrder, cancelSalesOrder,
} from '../controllers/salesOrder';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/', createSalesOrder);
router.get('/', getSalesOrders);
router.get('/:id', getSalesOrder);
router.post('/:id/submit', submitSalesOrder);
router.post('/:id/cancel', cancelSalesOrder);

export default router;
