import { Router } from 'express';
import { createSupplier, getSuppliers, getSupplier, updateSupplier, deleteSupplier } from '../controllers/supplier';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(resolveCompany);

router.post('/', createSupplier);
router.get('/', getSuppliers);
router.get('/:id', getSupplier);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

export default router;
