import {
  dailyAnswerTally,
  dailyMoves,
  dailyTally,
  pathRound,
  validRound,
  type DailyPlay,
} from '@btree/engine';
import {
  DAILY_ROUNDS,
  DailyFinishBody,
  dailyPenaltyMs,
  dailyScore,
  dailyTotal,
  type DailyEntry,
  type DailyRoundResult,
  type DailyState,
} from '@btree/shared';
import { Router } from 'express';
import type { DailyRound, DailyRun } from '../generated/prisma/client';
import { dailyContent, nextDayStart, validKeySets } from '../lib/daily';
import { dayKey } from '../lib/days';
import { HttpError, notFound, param } from '../lib/http';
import { prisma } from '../lib/prisma';
import { requireAuth, uid } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

export const dailyRouter = Router();

type RunWithRounds = DailyRun & { rounds: DailyRound[] };

const finalMs = (r: DailyRound) => (r.timeMs ?? 0) + (r.penaltyMs ?? 0);
const roundOf = (run: RunWithRounds, round: number) => run.rounds.find((r) => r.round === round);

function roundParam(req: Parameters<typeof param>[0]): number {
  const round = Number(param(req, 'round'));
  if (!DAILY_ROUNDS.some((r) => r.id === round)) throw notFound('Unknown round');
  return round;
}

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
    include: { user: { select: { displayName: true } }, rounds: true },
  });
  const timeOf = (run: RunWithRounds) => run.rounds.reduce((t, r) => t + finalMs(r), 0);
  return runs
    .sort(
      (a, b) =>
        b.score! - a.score! ||
        timeOf(a) - timeOf(b) ||
        a.finishedAt!.getTime() - b.finishedAt!.getTime(),
    )
    .map((run) => ({
      userId: run.userId,
      displayName: run.user.displayName,
      total: run.score!,
      path: roundOf(run, 1)?.score ?? 0,
      valid: roundOf(run, 2)?.score ?? 0,
      build: roundOf(run, 3)?.score ?? 0,
      isMe: run.userId === me,
    }));
}

function roundResult(r: DailyRound | undefined): DailyRoundResult | null {
  if (!r?.finishedAt) return null;
  return {
    score: r.score!,
    timeMs: r.timeMs!,
    penaltyMs: r.penaltyMs!,
    finalMs: finalMs(r),
    mistakes: r.mistakes!,
    hints: r.hints!,
    moves: r.moves!,
  };
}

async function loadRun(me: string, day: string): Promise<RunWithRounds | null> {
  return prisma.dailyRun.findUnique({
    where: { userId_day: { userId: me, day } },
    include: { rounds: true },
  });
}

async function state(me: string, day: string): Promise<DailyState> {
  const run = await loadRun(me, day);
  const started = (round: number) => Boolean(run && roundOf(run, round));
  const finished = Boolean(run?.finishedAt);
  return {
    day,
    resetsAt: nextDayStart(day).toISOString(),
    rounds: DAILY_ROUNDS.map(({ id }) => {
      const r = run ? roundOf(run, id) : undefined;
      return { round: id, startedAt: r?.startedAt.toISOString() ?? null, result: roundResult(r) };
    }),
    content: {
      path: run && started(1) ? { keys: run.pathKeys, seed: run.seed } : null,
      valid: run && started(2) ? { keySets: validKeySets(run.validKeys), seed: run.seed } : null,
      build: run && started(3) ? { keys: run.keys } : null,
    },
    total: finished ? run!.score : null,
    leaderboard: finished ? await leaderboard(me, day) : null,
  };
}

function tallyRound(run: DailyRun, round: number, plays: DailyPlay[]) {
  if (round === 1) {
    const moves = pathRound(run.pathKeys, run.seed).moves;
    return {
      moves: moves.length,
      ...dailyTally(
        moves,
        plays.map((p) => ({ ...p, hint: false })),
      ),
    };
  }
  if (round === 2) {
    const moves = validRound(validKeySets(run.validKeys), run.seed);
    return { moves: moves.length, ...dailyAnswerTally(moves, plays) };
  }
  const moves = dailyMoves(run.keys);
  return { moves: moves.length, ...dailyTally(moves, plays) };
}

dailyRouter.get('/daily', requireAuth, async (req, res) => {
  res.json(await state(uid(req), dayKey(new Date())));
});

dailyRouter.post('/daily/rounds/:round/start', requireAuth, async (req, res) => {
  const me = uid(req);
  const round = roundParam(req);
  const day = dayKey(new Date());
  let run = await loadRun(me, day);
  if (!run) {
    if (round !== 1) throw new HttpError(409, 'Start with round 1');
    await prisma.dailyRun.upsert({
      where: { userId_day: { userId: me, day } },
      create: { userId: me, day, ...dailyContent(day) },
      update: {},
    });
    run = (await loadRun(me, day))!;
  }
  if (round > 1 && !roundOf(run, round - 1)?.finishedAt) {
    throw new HttpError(409, `Finish round ${round - 1} first`);
  }
  await prisma.dailyRound.upsert({
    where: { runId_round: { runId: run.id, round } },
    create: { runId: run.id, round },
    update: {},
  });
  res.json(await state(me, day));
});

dailyRouter.post(
  '/daily/rounds/:round/finish',
  requireAuth,
  validateBody(DailyFinishBody),
  async (req, res) => {
    const me = uid(req);
    const round = roundParam(req);
    const { day, plays } = req.body as DailyFinishBody;
    const run = await loadRun(me, day);
    const row = run && roundOf(run, round);
    if (!run || !row) throw notFound(`Start round ${round} first`);
    if (row.finishedAt) throw new HttpError(409, 'You have already played this round today');

    const { moves, mistakes, hints, complete } = tallyRound(run, round, plays);
    if (!complete) throw new HttpError(400, 'Finish every move before submitting');
    const finishedAt = new Date();
    const timeMs = finishedAt.getTime() - row.startedAt.getTime();
    const penaltyMs = dailyPenaltyMs(mistakes, hints);
    const rate = DAILY_ROUNDS.find((r) => r.id === round)!.pointsPerSecond;
    const score = dailyScore(timeMs + penaltyMs, rate);
    const { count } = await prisma.dailyRound.updateMany({
      where: { id: row.id, finishedAt: null },
      data: { finishedAt, moves, mistakes, hints, timeMs, penaltyMs, score },
    });
    if (!count) throw new HttpError(409, 'You have already played this round today');

    if (round === DAILY_ROUNDS.length) {
      const others = run.rounds.filter((r) => r.round !== round).map((r) => r.score ?? 0);
      await prisma.dailyRun.update({
        where: { id: run.id },
        data: { finishedAt, score: dailyTotal([...others, score]) },
      });
    }
    res.json(await state(me, day));
  },
);
