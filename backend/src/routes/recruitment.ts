import { Router } from 'express';
import {
  createJobOpening, getJobOpenings,
  createJobApplicant, getJobApplicants, updateJobApplicantStatus,
} from '../controllers/hr';
import { authenticate, resolveCompany } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(resolveCompany);

router.post('/openings', createJobOpening);
router.get('/openings', getJobOpenings);
router.post('/applicants', createJobApplicant);
router.get('/applicants', getJobApplicants);
router.put('/applicants/:id/status', updateJobApplicantStatus);

export default router;
