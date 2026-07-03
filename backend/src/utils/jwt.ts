import jwt, { SignOptions } from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

// Fail fast instead of silently signing tokens with a predictable,
// hardcoded fallback secret if JWT_SECRET is missing from the environment.
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required but was not set');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];
const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as SignOptions['expiresIn'];

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  companyId?: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};
