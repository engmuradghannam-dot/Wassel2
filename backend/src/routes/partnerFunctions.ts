import { Router } from 'express';
import { createPartnerFunction, getPartnerFunctions, getPartnerFunction, updatePartnerFunction, deletePartnerFunction } from '../controllers/partnerFunction';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/', createPartnerFunction);
router.get('/', getPartnerFunctions);
router.get('/:id', getPartnerFunction);
router.put('/:id', updatePartnerFunction);
router.delete('/:id', deletePartnerFunction);

export default router;
