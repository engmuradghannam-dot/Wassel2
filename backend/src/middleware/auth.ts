import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { UserRole } from '@prisma/client';
import { AppError } from './errorHandler';
import prisma from '../utils/prisma';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
    companyId?: string;
  };
  companyId?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    req.user = decoded;
    next();
  } catch (error) {
    next(new AppError('Invalid or expired token', 401));
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
};

export const requireCompany = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.companyId) {
    throw new AppError('Company context required', 400);
  }
  next();
};

// Resolves and VALIDATES which company a request is allowed to act on.
//
// Previously every controller trusted `req.body.companyId` / `req.query.companyId`
// as-is, which let any authenticated user read or write another tenant's data
// simply by passing a different companyId — there was no check that the user
// actually belonged to that company. This middleware is now the single place
// that decides req.companyId, and it always verifies membership first.
//
// - A client MAY suggest which company it wants (query/body companyId), which
//   supports users who belong to more than one company and need to switch.
// - SUPER_ADMIN can act on any company (platform-level access).
// - Everyone else must have a CompanyMember row for that exact company, or
//   the request is rejected with 403 — it is never silently trusted.
export const resolveCompany = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const requested =
      (req.body && req.body.companyId) ||
      (req.query && (req.query.companyId as string)) ||
      req.user.companyId;

    if (!requested) {
      throw new AppError('Company ID required', 400);
    }

    if (req.user.role !== 'SUPER_ADMIN') {
      const membership = await prisma.companyMember.findUnique({
        where: { userId_companyId: { userId: req.user.userId, companyId: requested } },
      });

      if (!membership) {
        throw new AppError('You do not have access to this company', 403);
      }
    }

    req.companyId = requested;
    next();
  } catch (error) {
    next(error);
  }
};
