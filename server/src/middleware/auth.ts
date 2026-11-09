import type { RequestHandler } from 'express';
import { SESSION_COOKIE, verifySession } from '../lib/auth';
import { HttpError } from '../lib/http';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
  }
}

/** Reads the session cookie if present; never rejects. */
export const loadSession: RequestHandler = (req, _res, next) => {
  const token: unknown = req.cookies?.[SESSION_COOKIE];
  if (typeof token === 'string') req.userId = verifySession(token) ?? undefined;
  next();
};

/** Rejects requests without a valid session. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.userId) throw new HttpError(401, 'Sign in to save your progress');
  next();
};

/** userId of an authenticated request (call only after requireAuth). */
export const uid = (req: { userId?: string }): string => req.userId!;
