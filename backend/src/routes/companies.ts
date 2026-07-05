import { Router } from 'express';
import { createCompany, getCompanies, getCompany, updateCompany, deleteCompany } from '../controllers/company';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createCompany);
router.get('/', getCompanies);
router.get('/:id', getCompany);
router.put('/:id', updateCompany);
router.delete('/:id', deleteCompany);

export default router;
