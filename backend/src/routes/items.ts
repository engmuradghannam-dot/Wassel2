import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  res.json({ success: true, message: 'Items endpoint', data: [] });
});

export default router;
