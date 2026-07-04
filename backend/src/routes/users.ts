import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';

const router = Router();

router.use(authenticate);

router.get('/', authorize('SUPER_ADMIN', 'ADMIN'), async (req: any, res, next) => {
  try {
    // SUPER_ADMIN is a platform-level role and can see everyone. A plain
    // company ADMIN previously saw every user in the entire system too —
    // now they only see users who share a company with them.
    const where =
      req.user.role === 'SUPER_ADMIN'
        ? {}
        : { companyMemberships: { some: { company: { members: { some: { userId: req.user.userId } } } } } };

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(successResponse(users));
  } catch (error) {
    next(error);
  }
});

router.put('/:id/role', authorize('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true },
    });

    res.json(successResponse(user, 'User role updated'));
  } catch (error) {
    next(error);
  }
});

export default router;
