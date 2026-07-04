import { Router } from 'express';
import { createCustomer, getCustomers, getCustomer, updateCustomer, deleteCustomer } from '../controllers/customer';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(resolveCompany);

router.post('/', createCustomer);
router.get('/', getCustomers);
router.get('/:id', getCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;
