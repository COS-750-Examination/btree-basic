import {
  LEAF_REWARDS,
  readiness,
  stageFor,
  type GrowthStageId,
  type ObjectiveId,
} from '@btree/shared';
import { Prisma, type LeafReason } from '../generated/prisma/client';
import { addDays, dayKey } from './days';
import { prisma } from './prisma';

const DAY_MS = 24 * 60 * 60 * 1000;
const STREAK_LOOKBACK_DAYS = 60;

export async function leafBalance(userId: string): Promise<number> {
  const { _sum } = await prisma.leafTransaction.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return _sum.amount ?? 0;
}

export async function awardLeaves(
  userId: string,
  reason: Exclude<LeafReason, 'purchase'>,
  dedupeKey?: string,
): Promise<boolean> {
  try {
    await prisma.leafTransaction.create({
      data: { userId, reason, amount: LEAF_REWARDS[reason], dedupeKey },
    });
    return true;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return false;
    throw e;
  }
}

export async function modulesDone(userId: string): Promise<number> {
  return prisma.moduleProgress.count({ where: { userId, completedAt: { not: null } } });
}

export async function stageOf(userId: string): Promise<GrowthStageId> {
  return stageFor(await modulesDone(userId));
}

export async function readinessFor(userId: string) {
  const [attempts, done, leaves] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { userId },
      select: { objective: true, correct: true, firstAttempt: true, hintsUsed: true },
    }),
    modulesDone(userId),
    leafBalance(userId),
  ]);
  return readiness(
    attempts.map((a) => ({ ...a, objective: a.objective as ObjectiveId })),
    done,
    leaves,
  );
}

export async function streakRun(
  userId: string,
  now: Date = new Date(),
): Promise<{ days: number; start: string | null }> {
  const rows = await prisma.quizAttempt.findMany({
    where: {
      userId,
      createdAt: { gte: new Date(now.getTime() - STREAK_LOOKBACK_DAYS * DAY_MS), lte: now },
    },
    select: { createdAt: true },
  });
  const active = new Set(rows.map((r) => dayKey(r.createdAt)));
  let day = dayKey(now);
  if (!active.has(day)) day = addDays(day, -1);
  let days = 0;
  let start: string | null = null;
  while (active.has(day)) {
    days += 1;
    start = day;
    day = addDays(day, -1);
  }
  return { days, start };
}

export async function streakDays(userId: string, now: Date = new Date()): Promise<number> {
  return (await streakRun(userId, now)).days;
}
