import { Router } from 'express';
import {
  createQuotation, getQuotations, getQuotation,
  sendQuotation, cancelQuotation, convertQuotationToSalesOrder,
} from '../controllers/quotation';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/', createQuotation);
router.get('/', getQuotations);
router.get('/:id', getQuotation);
router.post('/:id/send', sendQuotation);
router.post('/:id/cancel', cancelQuotation);
router.post('/:id/convert', convertQuotationToSalesOrder);

export default router;
