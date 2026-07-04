import { Router } from 'express';
import { createTask, getTasks, updateTaskStatus } from '../controllers/project';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.post('/', createTask);
router.get('/', getTasks);
router.put('/:id/status', updateTaskStatus);

export default router;
