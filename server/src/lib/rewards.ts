import {
  LEAF_REWARDS,
  READY_CHECK_ITEM_IDS,
  READY_CHECK_PASS,
  STREAK_BONUS_DAYS,
  type LeafBonus,
} from '@btree/shared';
import { prisma } from './prisma';
import { awardLeaves, streakRun } from './progress';

export async function awardStreakBonus(
  userId: string,
  now: Date = new Date(),
): Promise<LeafBonus | null> {
  const { days, start } = await streakRun(userId, now);
  if (days < STREAK_BONUS_DAYS || !start) return null;
  const paid = await awardLeaves(userId, 'streak', `streak:${start}`);
  return paid ? { reason: 'streak', amount: LEAF_REWARDS.streak } : null;
}

export const isReadyCheckItem = (itemId: string): boolean =>
  (READY_CHECK_ITEM_IDS as readonly string[]).includes(itemId);

export async function passedReadyCheck(userId: string): Promise<boolean> {
  const passed = await prisma.quizAttempt.findMany({
    where: {
      userId,
      itemId: { in: [...READY_CHECK_ITEM_IDS] },
      correct: true,
      firstAttempt: true,
      hintsUsed: 0,
    },
    select: { itemId: true },
    distinct: ['itemId'],
  });
  return passed.length >= READY_CHECK_PASS;
}

export async function awardReadyCheckBonus(userId: string): Promise<LeafBonus | null> {
  if (!(await passedReadyCheck(userId))) return null;
  const paid = await awardLeaves(userId, 'readyCheck', 'readyCheck');
  return paid ? { reason: 'readyCheck', amount: LEAF_REWARDS.readyCheck } : null;
}
