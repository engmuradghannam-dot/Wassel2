import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { exportToCSV, exportToPDF, exportToExcel, getExportFormats } from '../controllers/export';

const router = Router();
router.use(authenticate);

router.post('/csv', exportToCSV);
router.post('/pdf', exportToPDF);
router.post('/excel', exportToExcel);
router.get('/formats', getExportFormats);

export default router;
