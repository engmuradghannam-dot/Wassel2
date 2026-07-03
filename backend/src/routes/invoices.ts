import { Router } from 'express';
import { createInvoice, getInvoices, getInvoice, updateInvoice, submitInvoice, cancelInvoice } from '../controllers/invoice';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createInvoice);
router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.put('/:id', updateInvoice);
router.post('/:id/submit', submitInvoice);
router.post('/:id/cancel', cancelInvoice);

export default router;
