import { Router } from 'express';
import { SESSION_COOKIE, sessionCookieOptions } from '../lib/auth';
import { dayKey } from '../lib/days';
import { exportUserData } from '../lib/export';
import { prisma } from '../lib/prisma';
import { requireAuth, uid } from '../middleware/auth';

export const accountRouter = Router();

accountRouter.get('/export', requireAuth, async (req, res) => {
  const data = await exportUserData(uid(req));
  res.attachment(`btree-basic-data-${dayKey(new Date())}.json`);
  res.json(data);
});

accountRouter.delete('/', requireAuth, async (req, res) => {
  await prisma.user.delete({ where: { id: uid(req) } });
  const { maxAge: _maxAge, ...opts } = sessionCookieOptions;
  res.clearCookie(SESSION_COOKIE, opts);
  res.status(204).end();
});
