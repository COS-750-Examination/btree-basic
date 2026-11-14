import { AccountPatchBody } from '@btree/shared';
import { Router, type RequestHandler } from 'express';
import { updateAccount } from '../lib/account';
import { SESSION_COOKIE, sessionCookieOptions } from '../lib/auth';
import { dayKey } from '../lib/days';
import { exportUserData } from '../lib/export';
import { prisma } from '../lib/prisma';
import { perUserLimiter } from '../lib/rateLimit';
import { requireAuth, uid } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

export const accountRouter = Router();

const passwordChangeLimiter = perUserLimiter({ windowMs: 15 * 60 * 1000, limit: 10 });

const limitPasswordChanges: RequestHandler = (req, res, next) =>
  (req.body as { newPassword?: unknown } | undefined)?.newPassword === undefined
    ? next()
    : passwordChangeLimiter(req, res, next);

accountRouter.get('/export', requireAuth, async (req, res) => {
  const data = await exportUserData(uid(req));
  res.attachment(`btree-basic-data-${dayKey(new Date())}.json`);
  res.json(data);
});

accountRouter.patch(
  '/',
  requireAuth,
  limitPasswordChanges,
  validateBody(AccountPatchBody),
  async (req, res) => {
    res.json(await updateAccount(uid(req), req.body as AccountPatchBody));
  },
);

accountRouter.delete('/', requireAuth, async (req, res) => {
  await prisma.user.delete({ where: { id: uid(req) } });
  const { maxAge: _maxAge, ...opts } = sessionCookieOptions;
  res.clearCookie(SESSION_COOKIE, opts);
  res.status(204).end();
});
