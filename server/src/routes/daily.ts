import { dailyMoves, dailyTally } from '@btree/engine';
import {
  DailyFinishBody,
  dailyPenaltyMs,
  dailyScore,
  type DailyEntry,
  type DailyResult,
  type DailyState,
} from '@btree/shared';
import { Router } from 'express';
import { dailyKeys, nextDayStart } from '../lib/daily';
import { dayKey } from '../lib/days';
import { HttpError, notFound } from '../lib/http';
import { prisma } from '../lib/prisma';
import { requireAuth, uid } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

export const dailyRouter = Router();

async function friendIds(me: string): Promise<string[]> {
  const rows = await prisma.friendship.findMany({
    where: { status: 'accepted', OR: [{ requesterId: me }, { addresseeId: me }] },
    select: { requesterId: true, addresseeId: true },
  });
  return rows.map((r) => (r.requesterId === me ? r.addresseeId : r.requesterId));
}

async function leaderboard(me: string, day: string): Promise<DailyEntry[]> {
  const runs = await prisma.dailyRun.findMany({
    where: { day, finishedAt: { not: null }, userId: { in: [me, ...(await friendIds(me))] } },
    include: { user: { select: { displayName: true } } },
  });
  const finalMs = (r: (typeof runs)[number]) => r.timeMs! + r.penaltyMs!;
  return runs
    .sort(
      (a, b) =>
        b.score! - a.score! ||
        finalMs(a) - finalMs(b) ||
        a.finishedAt!.getTime() - b.finishedAt!.getTime(),
    )
    .map((r, i) => ({
      rank: i + 1,
      userId: r.userId,
      displayName: r.user.displayName,
      score: r.score!,
      finalMs: finalMs(r),
      isMe: r.userId === me,
    }));
}

async function state(me: string, day: string): Promise<DailyState> {
  const run = await prisma.dailyRun.findUnique({ where: { userId_day: { userId: me, day } } });
  const finished = Boolean(run?.finishedAt);
  const result: DailyResult | null = finished
    ? {
        score: run!.score!,
        timeMs: run!.timeMs!,
        penaltyMs: run!.penaltyMs!,
        finalMs: run!.timeMs! + run!.penaltyMs!,
        mistakes: run!.mistakes!,
        hints: run!.hints!,
        moves: run!.moves!,
      }
    : null;
  return {
    day,
    resetsAt: nextDayStart(day).toISOString(),
    startedAt: run?.startedAt.toISOString() ?? null,
    keys: run?.keys ?? null,
    result,
    leaderboard: finished ? await leaderboard(me, day) : null,
  };
}

dailyRouter.get('/daily', requireAuth, async (req, res) => {
  res.json(await state(uid(req), dayKey(new Date())));
});

dailyRouter.post('/daily/start', requireAuth, async (req, res) => {
  const me = uid(req);
  const day = dayKey(new Date());
  await prisma.dailyRun.upsert({
    where: { userId_day: { userId: me, day } },
    create: { userId: me, day, keys: dailyKeys(day) },
    update: {},
  });
  res.json(await state(me, day));
});

dailyRouter.post('/daily/finish', requireAuth, validateBody(DailyFinishBody), async (req, res) => {
  const me = uid(req);
  const { day, plays } = req.body as DailyFinishBody;
  const run = await prisma.dailyRun.findUnique({ where: { userId_day: { userId: me, day } } });
  if (!run) throw notFound('Start the daily b-tree first');
  if (run.finishedAt) throw new HttpError(409, 'You have already played this daily b-tree');
  const moves = dailyMoves(run.keys);
  const { mistakes, hints, complete } = dailyTally(moves, plays);
  if (!complete) throw new HttpError(400, 'Finish every move before submitting');
  const finishedAt = new Date();
  const timeMs = finishedAt.getTime() - run.startedAt.getTime();
  const penaltyMs = dailyPenaltyMs(mistakes, hints);
  const { count } = await prisma.dailyRun.updateMany({
    where: { id: run.id, finishedAt: null },
    data: {
      finishedAt,
      moves: moves.length,
      mistakes,
      hints,
      timeMs,
      penaltyMs,
      score: dailyScore(timeMs + penaltyMs),
    },
  });
  if (!count) throw new HttpError(409, 'You have already played this daily b-tree');
  res.json(await state(me, day));
});
