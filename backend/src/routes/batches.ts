import { Router } from 'express';
import { createBatch, getBatches, getBatch, updateBatch, deleteBatch } from '../controllers/batch';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/', createBatch);
router.get('/', getBatches);
router.get('/:id', getBatch);
router.put('/:id', updateBatch);
router.delete('/:id', deleteBatch);

export default router;
