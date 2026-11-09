import type { RequestHandler } from 'express';
import type { z } from 'zod';
import { HttpError } from '../lib/http';

/** Validates `req.body` against a shared Zod schema and replaces it with the parsed value (NFR8). */
export const validateBody =
  <S extends z.ZodType>(schema: S): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new HttpError(400, 'Invalid request body', result.error.issues);
    }
    req.body = result.data;
    next();
  };
