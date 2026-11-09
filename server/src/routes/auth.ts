import { LoginBody, RegisterBody, type PublicUser } from '@btree/shared';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import type { User } from '../generated/prisma/client';
import {
  SESSION_COOKIE,
  hashPassword,
  sessionCookieOptions,
  signSession,
  verifyPassword,
} from '../lib/auth';
import { HttpError } from '../lib/http';
import { prisma } from '../lib/prisma';
import { requireAuth, uid } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

export const toPublicUser = (u: User): PublicUser => ({
  id: u.id,
  email: u.email,
  displayName: u.displayName,
  plantedAt: u.plantedAt.toISOString(),
});

authRouter.post('/register', authLimiter, validateBody(RegisterBody), async (req, res) => {
  const body = req.body as RegisterBody;
  if (await prisma.user.findUnique({ where: { email: body.email } })) {
    throw new HttpError(409, 'An account with this email already exists');
  }
  const user = await prisma.user.create({
    data: {
      email: body.email,
      displayName: body.displayName,
      passwordHash: await hashPassword(body.password),
    },
  });
  res.cookie(SESSION_COOKIE, signSession(user.id), sessionCookieOptions);
  res.status(201).json(toPublicUser(user));
});

authRouter.post('/login', authLimiter, validateBody(LoginBody), async (req, res) => {
  const body = req.body as LoginBody;
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  // Same message for unknown email and wrong password, so accounts cannot be enumerated.
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    throw new HttpError(401, 'Email or password is incorrect');
  }
  res.cookie(SESSION_COOKIE, signSession(user.id), sessionCookieOptions);
  res.json(toPublicUser(user));
});

authRouter.post('/logout', (_req, res) => {
  const { maxAge: _maxAge, ...opts } = sessionCookieOptions;
  res.clearCookie(SESSION_COOKIE, opts);
  res.status(204).end();
});

/** Always 200: `{ user: null }` for guests, so the client can check without a console error. */
authRouter.get('/session', async (req, res) => {
  const user = req.userId ? await prisma.user.findUnique({ where: { id: req.userId } }) : null;
  res.json({ user: user ? toPublicUser(user) : null });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: uid(req) } });
  if (!user) throw new HttpError(401, 'Session expired');
  res.json(toPublicUser(user));
});
