import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Placeholder - will implement controllers
router.get('/', async (req, res) => {
  res.json({ success: true, message: 'Branches endpoint', data: [] });
});

export default router;
