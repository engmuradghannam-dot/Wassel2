import { Router } from 'express';
import { createPriceList, getPriceLists, getPriceList, addPriceListItem, resolvePrice, deletePriceList } from '../controllers/priceList';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/', createPriceList);
router.get('/', getPriceLists);
router.get('/resolve-price', resolvePrice);
router.get('/:id', getPriceList);
router.post('/:id/items', addPriceListItem);
router.delete('/:id', deletePriceList);

export default router;
