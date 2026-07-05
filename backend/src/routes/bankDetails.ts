import { Router } from 'express';
import { createBankDetail, getBankDetails, getBankDetail, updateBankDetail, deleteBankDetail } from '../controllers/bankDetail';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/', createBankDetail);
router.get('/', getBankDetails);
router.get('/:id', getBankDetail);
router.put('/:id', updateBankDetail);
router.delete('/:id', deleteBankDetail);

export default router;
