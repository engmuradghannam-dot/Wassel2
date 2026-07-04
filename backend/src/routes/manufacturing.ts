import { Router } from 'express';
import {
  createBOM, getBOMs,
  createWorkOrder, getWorkOrders, completeWorkOrder,
  createJobCard, getJobCards, updateJobCardStatus,
} from '../controllers/manufacturing';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.post('/boms', createBOM);
router.get('/boms', getBOMs);

router.post('/work-orders', createWorkOrder);
router.get('/work-orders', getWorkOrders);
router.post('/work-orders/:id/complete', completeWorkOrder);

router.post('/job-cards', createJobCard);
router.get('/job-cards', getJobCards);
router.put('/job-cards/:id/status', updateJobCardStatus);

export default router;
