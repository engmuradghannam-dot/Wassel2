import { Router } from 'express';
import { createProject, getProjects, updateProject, deleteProject, createTimesheet, getTimesheets } from '../controllers/project';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/', createProject);
router.get('/', getProjects);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

router.post('/timesheets', createTimesheet);
router.get('/timesheets', getTimesheets);

export default router;
