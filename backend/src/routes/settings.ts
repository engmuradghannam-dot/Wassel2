import { Router } from 'express';
import { authenticate, resolveCompany } from '../middleware/auth';
import { getSettings, updateSetting, getCompanySettings, updateCompanySettings } from '../controllers/settings';

const router = Router();
router.use(authenticate, resolveCompany);

router.get('/', getSettings);
router.put('/', updateSetting);
router.get('/company', getCompanySettings);
router.put('/company', updateCompanySettings);

export default router;
