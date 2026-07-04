import { Router } from 'express';
import { createIssue, getIssues, getIssue, updateIssue } from '../controllers/issue';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/', createIssue);
router.get('/', getIssues);
router.get('/:id', getIssue);
router.put('/:id', updateIssue);

export default router;
