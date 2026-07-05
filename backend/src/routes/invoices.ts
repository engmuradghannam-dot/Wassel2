import { Router } from 'express';
import { createInvoice, getInvoices, getInvoice, updateInvoice, submitInvoice, cancelInvoice, getInvoiceZatcaQr, matchThreeWay } from '../controllers/invoice';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(resolveCompany);

router.post('/', createInvoice);
router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.get('/:id/zatca-qr', getInvoiceZatcaQr);
router.put('/:id', updateInvoice);
router.post('/:id/submit', submitInvoice);
router.post('/:id/cancel', cancelInvoice);
router.post('/:id/match', matchThreeWay);

export default router;
