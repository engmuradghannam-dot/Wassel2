import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { uploadFile, getFiles, deleteFile, downloadFile } from '../controllers/file';

const upload = multer({ dest: 'uploads/' });
const router = Router();
router.use(authenticate);

router.post('/upload', upload.single('file'), uploadFile);
router.get('/', getFiles);
router.get('/:id/download', downloadFile);
router.delete('/:id', deleteFile);

export default router;
