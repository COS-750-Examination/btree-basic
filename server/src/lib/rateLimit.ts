import type { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { uid } from '../middleware/auth';

export const RATE_LIMIT_MESSAGE = 'Slow down a little and try again later';

export interface PerUserLimit {
  windowMs: number;
  limit: number;
}

export function perUserLimiter({ windowMs, limit }: PerUserLimit): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    keyGenerator: (req) => uid(req),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: RATE_LIMIT_MESSAGE },
  });
}
