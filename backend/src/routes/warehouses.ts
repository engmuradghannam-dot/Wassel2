import { Router } from 'express';
import { createWarehouse, getWarehouses, updateWarehouse, deleteWarehouse, getStockLevels } from '../controllers/warehouse';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.post('/', createWarehouse);
router.get('/', getWarehouses);
router.get('/stock-levels', getStockLevels);
router.put('/:id', updateWarehouse);
router.delete('/:id', deleteWarehouse);

export default router;
