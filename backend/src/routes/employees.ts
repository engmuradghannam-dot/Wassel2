import { Router } from 'express';
import { createEmployee, getEmployees, getEmployee, updateEmployee, deleteEmployee } from '../controllers/employee';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createEmployee);
router.get('/', getEmployees);
router.get('/:id', getEmployee);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

export default router;
