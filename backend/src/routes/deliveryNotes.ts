import { Router } from 'express';
import {
  createDeliveryNote, getDeliveryNotes, getDeliveryNote,
  submitDeliveryNote, cancelDeliveryNote,
} from '../controllers/deliveryNote';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/', createDeliveryNote);
router.get('/', getDeliveryNotes);
router.get('/:id', getDeliveryNote);
router.post('/:id/submit', submitDeliveryNote);
router.post('/:id/cancel', cancelDeliveryNote);

export default router;
