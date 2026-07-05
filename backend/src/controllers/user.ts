import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const updateUserSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

const updateRoleSchema = z.object({
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER']),
  companyId: z.string().optional(),
});

export const getUsers = async (req: any, res: Response, next: NextFunction) => {
  try {
    const where = req.user.role === 'SUPER_ADMIN'
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
        companyMemberships: {
          select: {
            companyId: true,
            role: true,
            company: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(successResponse(users));
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'SUPER_ADMIN' && req.user.userId !== id) {
      const sharedCompany = await prisma.companyMember.findFirst({
        where: {
          userId: id,
          company: { members: { some: { userId: req.user.userId } } },
        },
      });
      if (!sharedCompany) throw new AppError('User not found', 404);
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        companyMemberships: {
          select: {
            companyId: true,
            role: true,
            company: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!user) throw new AppError('User not found', 404);
    res.json(successResponse(user));
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateUserSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, status: true, role: true },
    });
    res.json(successResponse(user, 'User updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { role } = updateRoleSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true },
    });
    res.json(successResponse(user, 'User role updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (id === req.user.userId) throw new AppError('Cannot delete yourself', 400);
    await prisma.user.delete({ where: { id } });
    res.json(successResponse(null, 'User deleted successfully'));
  } catch (error) {
    next(error);
  }
};

export const getUserProfile = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        companyMemberships: {
          select: {
            companyId: true,
            role: true,
            company: { select: { id: true, name: true, logo: true } },
          },
        },
      },
    });
    res.json(successResponse(user));
  } catch (error) {
    next(error);
  }
};

export const updateUserProfile = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = updateUserSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data,
      select: { id: true, email: true, firstName: true, lastName: true, phone: true },
    });
    res.json(successResponse(user, 'Profile updated successfully'));
  } catch (error) {
    next(error);
  }
};
