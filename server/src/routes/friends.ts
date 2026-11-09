import {
  CheerBody,
  FriendRequestBody,
  MODULES,
  type FriendGrove,
  type FriendSummary,
} from '@btree/shared';
import { Router } from 'express';
import { HttpError, notFound, param } from '../lib/http';
import { prisma } from '../lib/prisma';
import { stageOf, streakDays } from '../lib/progress';
import { requireAuth, uid } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

/**
 * Friends' groves: visit-only relatedness. No leaderboards or rankings, and a friend never
 * sees quiz answers, scores or hints (ID doc, Motivation & Engagement). Mounted at /api.
 */
export const friendsRouter = Router();

/** Accepted friendship between the two users, or null. */
async function friendship(a: string, b: string) {
  return prisma.friendship.findFirst({
    where: {
      status: 'accepted',
      OR: [
        { requesterId: a, addresseeId: b },
        { requesterId: b, addresseeId: a },
      ],
    },
  });
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
    include: { requester: { select: { displayName: true } } },
  });
  const friends = await Promise.all(
    rows
      .filter((r) => r.status === 'accepted')
      .map((r) =>
        summary(r.requesterId === me ? r.addresseeId : r.requesterId, r.acceptedAt ?? r.createdAt),
      ),
  );
  const incoming = rows
    .filter((r) => r.status === 'pending' && r.addresseeId === me)
    .map((r) => ({ id: r.id, fromName: r.requester.displayName }));
  res.json({ friends, incoming });
});

friendsRouter.post(
  '/friends/requests',
  requireAuth,
  validateBody(FriendRequestBody),
  async (req, res) => {
    const me = uid(req);
    const { email } = req.body as FriendRequestBody;
    const other = await prisma.user.findUnique({ where: { email } });
    // Do not reveal whether an email has an account.
    if (!other || other.id === me) {
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

/** Cheers sent to or by the current user, newest first. */
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
