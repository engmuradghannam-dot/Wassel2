import { Router } from 'express';
import { createStockEntry, getStockEntries, submitStockEntry, cancelStockEntry } from '../controllers/stockEntry';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.post('/', createStockEntry);
router.get('/', getStockEntries);
router.post('/:id/submit', submitStockEntry);
router.post('/:id/cancel', cancelStockEntry);

export default router;
