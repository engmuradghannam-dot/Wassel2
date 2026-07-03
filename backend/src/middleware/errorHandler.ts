import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';
import { errorResponse } from '../utils/response';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const SENSITIVE_FIELDS = ['password', 'currentPassword', 'newPassword', 'token', 'refreshToken'];

// Redact sensitive fields before logging so secrets never end up in log files.
const redactBody = (body: unknown): unknown => {
  if (!body || typeof body !== 'object') return body;
  const clone: Record<string, unknown> = { ...(body as Record<string, unknown>) };
  for (const field of SENSITIVE_FIELDS) {
    if (field in clone) clone[field] = '[REDACTED]';
  }
  return clone;
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: redactBody(req.body),
    query: req.query,
    user: (req as any).user?.id,
  });

  // Zod validation error
  if (err instanceof ZodError) {
    const messages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return res.status(400).json(errorResponse('Validation error', messages));
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json(errorResponse('Duplicate entry', 'A record with this value already exists'));
    }
    if (err.code === 'P2025') {
      return res.status(404).json(errorResponse('Not found', 'Record not found'));
    }
    return res.status(400).json(errorResponse('Database error', err.message));
  }

  // Custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(errorResponse(err.message));
  }

  // Default
  const statusCode = (err as any).statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(statusCode).json(errorResponse(message, err.message));
};
