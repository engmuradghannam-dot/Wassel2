import { Router } from 'express';
import { createSupplier, getSuppliers, getSupplier, updateSupplier, deleteSupplier } from '../controllers/supplier';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createSupplier);
router.get('/', getSuppliers);
router.get('/:id', getSupplier);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

export default router;
