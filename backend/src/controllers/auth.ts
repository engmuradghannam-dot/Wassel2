import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    const hashedPassword = await hashPassword(data.password);

    // Bootstrap: if this is the very first user in the whole system, promote
    // them to SUPER_ADMIN so there is always a way to create the first
    // company without needing manual DB access. Every subsequent registration
    // stays a regular USER.
    const isFirstUser = (await prisma.user.count()) === 0;

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: isFirstUser ? 'SUPER_ADMIN' : 'USER',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json(successResponse({
      user,
      token,
      refreshToken,
    }, 'User registered successfully'));
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { companyMemberships: { orderBy: { createdAt: 'asc' }, take: 1 } },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isValid = await comparePassword(data.password, user.password);

    if (!isValid) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError('Account is not active', 403);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Default company is just a convenience hint for the frontend — every
    // request still re-validates membership via resolveCompany, so this is
    // never trusted on its own.
    const defaultCompanyId = user.companyMemberships[0]?.companyId;

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: defaultCompanyId,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: defaultCompanyId,
    });

    res.json(successResponse({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
      },
      token,
      refreshToken,
    }, 'Login successful'));
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token required', 400);
    }

    const decoded = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { companyMemberships: { orderBy: { createdAt: 'asc' }, take: 1 } },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('Invalid refresh token', 401);
    }

    // Keep the company context alive across refreshes — previously this was
    // dropped on every refresh, silently kicking the user out of their
    // company context until they logged in again.
    const newToken = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyMemberships[0]?.companyId,
    });

    res.json(successResponse({ token: newToken }, 'Token refreshed'));
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json(successResponse(user, 'User profile'));
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: any, res: Response, next: NextFunction) => {
  try {
    const updateSchema = z.object({
      firstName: z.string().min(2).optional(),
      lastName: z.string().min(2).optional(),
      phone: z.string().optional(),
      avatar: z.string().optional(),
    });

    const data = updateSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
      },
    });

    res.json(successResponse(user, 'Profile updated'));
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: any, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8),
    });

    const data = schema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isValid = await comparePassword(data.currentPassword, user.password);

    if (!isValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    const hashedPassword = await hashPassword(data.newPassword);

    await prisma.user.update({
      where: { id: req.user.userId },
      data: { password: hashedPassword },
    });

    res.json(successResponse(null, 'Password changed successfully'));
  } catch (error) {
    next(error);
  }
};
