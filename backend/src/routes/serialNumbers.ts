import { Router } from 'express';
import { createSerialNumber, bulkCreateSerialNumbers, getSerialNumbers, updateSerialNumberStatus, deleteSerialNumber } from '../controllers/serialNumber';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/', createSerialNumber);
router.post('/bulk', bulkCreateSerialNumbers);
router.get('/', getSerialNumbers);
router.put('/:id/status', updateSerialNumberStatus);
router.delete('/:id', deleteSerialNumber);

export default router;
