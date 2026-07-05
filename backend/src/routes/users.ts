import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getUsers, getUser, updateUser, updateUserRole, deleteUser,
  getUserProfile, updateUserProfile,
} from '../controllers/user';

const router = Router();
router.use(authenticate);

router.get('/', getUsers);
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.get('/:id', getUser);
router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN'), updateUser);
router.put('/:id/role', authorize('SUPER_ADMIN'), updateUserRole);
router.delete('/:id', authorize('SUPER_ADMIN'), deleteUser);

export default router;
