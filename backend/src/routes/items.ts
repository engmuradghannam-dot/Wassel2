import { Router } from 'express';
import { createItem, getItems, getItem, updateItem, deleteItem } from '../controllers/item';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(resolveCompany);

router.post('/', createItem);
router.get('/', getItems);
router.get('/:id', getItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

export default router;
