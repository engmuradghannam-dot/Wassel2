import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { sendEmail, sendBulkEmail, getEmailTemplates, testConnection } from '../controllers/email';

const router = Router();
router.use(authenticate);

router.post('/send', sendEmail);
router.post('/send-bulk', sendBulkEmail);
router.get('/templates', getEmailTemplates);
router.get('/test-connection', testConnection);

export default router;
