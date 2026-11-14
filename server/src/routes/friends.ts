import {
  CHEERS_PER_HOUR,
  CheerBody,
  FRIEND_REQUESTS_PER_HOUR,
  FriendRequestBody,
  MODULES,
  type FriendGrove,
  type FriendsList,
  type FriendSummary,
} from '@btree/shared';
import { Router } from 'express';
import { HttpError, notFound, param } from '../lib/http';
import { prisma } from '../lib/prisma';
import { stageOf, streakDays } from '../lib/progress';
import { perUserLimiter } from '../lib/rateLimit';
import { requireAuth, uid } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

export const friendsRouter = Router();

const HOUR_MS = 60 * 60 * 1000;
const friendRequestLimiter = perUserLimiter({ windowMs: HOUR_MS, limit: FRIEND_REQUESTS_PER_HOUR });
const cheerLimiter = perUserLimiter({ windowMs: HOUR_MS, limit: CHEERS_PER_HOUR });

const between = (a: string, b: string) => [
  { requesterId: a, addresseeId: b },
  { requesterId: b, addresseeId: a },
];

async function friendship(a: string, b: string) {
  return prisma.friendship.findFirst({ where: { status: 'accepted', OR: between(a, b) } });
}

async function summary(userId: string, since: Date): Promise<FriendSummary> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const modulesDone = await prisma.moduleProgress.count({
    where: { userId, completedAt: { not: null } },
  });
  return {
    id: user.id,
    displayName: user.displayName,
    stage: await stageOf(userId),
    modulesDone,
    since: since.toISOString(),
  };
}

friendsRouter.get('/friends', requireAuth, async (req, res) => {
  const me = uid(req);
  const rows = await prisma.friendship.findMany({
    where: { OR: [{ requesterId: me }, { addresseeId: me }] },
    include: {
      requester: { select: { displayName: true } },
      addressee: { select: { email: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  const friends = await Promise.all(
    rows
      .filter((r) => r.status === 'accepted')
      .map((r) =>
        summary(r.requesterId === me ? r.addresseeId : r.requesterId, r.acceptedAt ?? r.createdAt),
      ),
  );
  const pending = rows.filter((r) => r.status === 'pending');
  const list: FriendsList = {
    friends,
    incoming: pending
      .filter((r) => r.addresseeId === me)
      .map((r) => ({ id: r.id, fromName: r.requester.displayName })),
    outgoing: pending
      .filter((r) => r.requesterId === me)
      .map((r) => ({ id: r.id, email: r.addressee.email, sentAt: r.createdAt.toISOString() })),
  };
  res.json(list);
});

friendsRouter.post(
  '/friends/requests',
  requireAuth,
  friendRequestLimiter,
  validateBody(FriendRequestBody),
  async (req, res) => {
    const me = uid(req);
    const { email } = req.body as FriendRequestBody;
    const other = await prisma.user.findUnique({ where: { email } });
    if (!other || other.id === me) {
      res.status(202).json({ ok: true });
      return;
    }
    const existing = await prisma.friendship.findFirst({ where: { OR: between(me, other.id) } });
    if (existing?.status === 'accepted') {
      res.status(202).json({ ok: true });
      return;
    }
    if (existing && existing.requesterId === other.id) {
      await prisma.friendship.update({
        where: { id: existing.id },
        data: { status: 'accepted', acceptedAt: new Date() },
      });
      res.status(202).json({ ok: true });
      return;
    }
    await prisma.friendship.upsert({
      where: { requesterId_addresseeId: { requesterId: me, addresseeId: other.id } },
      create: { requesterId: me, addresseeId: other.id },
      update: {},
    });
    res.status(202).json({ ok: true });
  },
);

friendsRouter.post('/friends/requests/:id/accept', requireAuth, async (req, res) => {
  const { count } = await prisma.friendship.updateMany({
    where: { id: param(req, 'id'), addresseeId: uid(req), status: 'pending' },
    data: { status: 'accepted', acceptedAt: new Date() },
  });
  if (!count) throw notFound('Friend request not found');
  res.status(204).end();
});

friendsRouter.post('/friends/requests/:id/decline', requireAuth, async (req, res) => {
  const { count } = await prisma.friendship.deleteMany({
    where: { id: param(req, 'id'), addresseeId: uid(req), status: 'pending' },
  });
  if (!count) throw notFound('Friend request not found');
  res.status(204).end();
});

friendsRouter.delete('/friends/requests/:id', requireAuth, async (req, res) => {
  const { count } = await prisma.friendship.deleteMany({
    where: { id: param(req, 'id'), requesterId: uid(req), status: 'pending' },
  });
  if (!count) throw notFound('Friend request not found');
  res.status(204).end();
});

friendsRouter.delete('/friends/:id', requireAuth, async (req, res) => {
  const { count } = await prisma.friendship.deleteMany({
    where: { status: 'accepted', OR: between(uid(req), param(req, 'id')) },
  });
  if (!count) throw notFound('Friend not found');
  res.status(204).end();
});

friendsRouter.get('/friends/:id/grove', requireAuth, async (req, res) => {
  const me = uid(req);
  const friendId = param(req, 'id');
  const link = await friendship(me, friendId);
  if (!link) throw notFound('Friend not found');

  const [base, user, modules, decorations, streak] = await Promise.all([
    summary(friendId, link.acceptedAt ?? link.createdAt),
    prisma.user.findUniqueOrThrow({ where: { id: friendId } }),
    prisma.moduleProgress.findMany({ where: { userId: friendId }, orderBy: { moduleId: 'asc' } }),
    prisma.userDecoration.findMany({
      where: { userId: friendId, placed: true },
      select: { decorationId: true },
    }),
    streakDays(friendId),
  ]);
  const completed = modules.filter((m) => m.completedAt).map((m) => m.moduleId);
  const grove: FriendGrove = {
    ...base,
    plantedAt: user.plantedAt.toISOString(),
    streakDays: streak,
    decorations: decorations.map((d) => d.decorationId),
    completedModules: completed,
    currentModule: MODULES.map((m) => m.id).find((id) => !completed.includes(id)) ?? null,
  };
  res.json(grove);
});

friendsRouter.post(
  '/friends/:id/cheers',
  requireAuth,
  cheerLimiter,
  validateBody(CheerBody),
  async (req, res) => {
    const me = uid(req);
    const friendId = param(req, 'id');
    if (!(await friendship(me, friendId))) throw new HttpError(403, 'You can only cheer friends');
    const body = req.body as CheerBody;
    await prisma.cheer.create({
      data: { fromId: me, toId: friendId, message: body.message, moduleId: body.moduleId },
    });
    res.status(201).json({ ok: true });
  },
);

friendsRouter.get('/cheers', requireAuth, async (req, res) => {
  const me = uid(req);
  const rows = await prisma.cheer.findMany({
    where: { OR: [{ toId: me }, { fromId: me }] },
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: { from: { select: { displayName: true } }, to: { select: { displayName: true } } },
  });
  res.json(
    rows.map((c) => ({
      id: c.id,
      fromName: c.from.displayName,
      toName: c.to.displayName,
      message: c.message,
      moduleId: c.moduleId,
      createdAt: c.createdAt.toISOString(),
    })),
  );
});
