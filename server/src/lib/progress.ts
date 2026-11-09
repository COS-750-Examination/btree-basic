import {
  LEAF_REWARDS,
  readiness,
  stageFor,
  type GrowthStageId,
  type ObjectiveId,
} from '@btree/shared';
import type { LeafReason } from '../generated/prisma/client';
import { prisma } from './prisma';

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
): Promise<void> {
  await prisma.leafTransaction.create({ data: { userId, reason, amount: LEAF_REWARDS[reason] } });
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

/** Consecutive days, ending today or yesterday, on which the user answered at least one question. */
export async function streakDays(userId: string): Promise<number> {
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const rows = await prisma.quizAttempt.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { createdAt: true },
  });
  const days = new Set(rows.map((r) => r.createdAt.toISOString().slice(0, 10)));
  const day = new Date();
  if (!days.has(day.toISOString().slice(0, 10))) day.setUTCDate(day.getUTCDate() - 1);
  let streak = 0;
  while (days.has(day.toISOString().slice(0, 10))) {
    streak += 1;
    day.setUTCDate(day.getUTCDate() - 1);
  }
  return streak;
}
