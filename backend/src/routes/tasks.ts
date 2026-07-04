import { Router } from 'express';
import { createTask, getTasks, updateTaskStatus } from '../controllers/project';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/', createTask);
router.get('/', getTasks);
router.put('/:id/status', updateTaskStatus);

export default router;
