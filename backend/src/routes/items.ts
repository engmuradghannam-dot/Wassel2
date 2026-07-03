import { Router } from 'express';
import { createItem, getItems, getItem, updateItem, deleteItem } from '../controllers/item';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createItem);
router.get('/', getItems);
router.get('/:id', getItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

export default router;
