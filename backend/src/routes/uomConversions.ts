import { Router } from 'express';
import { createUOMConversion, getUOMConversions, convertQuantity, deleteUOMConversion } from '../controllers/uomConversion';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/', createUOMConversion);
router.get('/', getUOMConversions);
router.post('/convert', convertQuantity);
router.delete('/:id', deleteUOMConversion);

export default router;
