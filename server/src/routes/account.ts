import { Router } from 'express';
import { SESSION_COOKIE, sessionCookieOptions } from '../lib/auth';
import { prisma } from '../lib/prisma';
import { requireAuth, uid } from '../middleware/auth';

export const accountRouter = Router();

/** FR10 / POPIA: deleting the account removes every row that belongs to the user (cascade). */
accountRouter.delete('/', requireAuth, async (req, res) => {
  await prisma.user.delete({ where: { id: uid(req) } });
  const { maxAge: _maxAge, ...opts } = sessionCookieOptions;
  res.clearCookie(SESSION_COOKIE, opts);
  res.status(204).end();
});
