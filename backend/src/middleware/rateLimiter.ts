import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 10000 : 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 5,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later',
  },
});
