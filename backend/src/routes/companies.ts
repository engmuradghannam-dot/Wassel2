import { Router } from 'express';
import { createCompany, getCompanies, getCompany, updateCompany, deleteCompany } from '../controllers/company';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), createCompany);
router.get('/', getCompanies);
router.get('/:id', getCompany);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateCompany);
router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), deleteCompany);

export default router;
