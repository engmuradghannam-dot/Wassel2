import { Router } from 'express';
import { createWarehouse, getWarehouses, updateWarehouse, deleteWarehouse, getStockLevels } from '../controllers/warehouse';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/', createWarehouse);
router.get('/', getWarehouses);
router.get('/stock-levels', getStockLevels);
router.put('/:id', updateWarehouse);
router.delete('/:id', deleteWarehouse);

export default router;
