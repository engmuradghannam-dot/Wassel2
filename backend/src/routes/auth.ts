import { Router } from 'express';
import { register, login, refreshToken, getMe, updateProfile, changePassword, googleLogin } from '../controllers/auth';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.post('/refresh', refreshToken);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

router.post('/google', googleLogin);

export default router;
