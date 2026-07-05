import { Router } from 'express';
import { authenticate, resolveCompany } from '../middleware/auth';
import { importData, getImportLogs, getImportTemplate } from '../controllers/import';

const router = Router();
router.use(authenticate, resolveCompany);

router.post('/', importData);
router.get('/logs', getImportLogs);
router.get('/template/:entityType', getImportTemplate);

export default router;
