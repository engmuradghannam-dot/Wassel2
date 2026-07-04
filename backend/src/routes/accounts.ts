import { Router } from 'express';
import { createAccount, getAccounts, updateAccount, deleteAccount } from '../controllers/accounting';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/', createAccount);
router.get('/', getAccounts);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);

export default router;
