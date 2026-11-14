import {
  BADGES,
  SPLITTER_RUN,
  objectiveMastery,
  type Badge,
  type BadgeId,
  type ObjectiveId,
} from '@btree/shared';
import { isUniqueViolation, prisma } from './prisma';
import { passedReadyCheck } from './rewards';

export async function earnedExplorer(userId: string): Promise<boolean> {
  const [warmup, moduleOne] = await Promise.all([
    prisma.warmupResult.findFirst({ where: { userId }, select: { id: true } }),
    prisma.moduleProgress.findFirst({
      where: { userId, moduleId: 1, completedAt: { not: null } },
      select: { id: true },
    }),
  ]);
  return Boolean(warmup && moduleOne);
}

export async function earnedSplitter(userId: string): Promise<boolean> {
  const latest = await prisma.quizAttempt.findMany({
    where: { userId, objective: 'O5' },
    orderBy: { createdAt: 'desc' },
    take: SPLITTER_RUN,
    select: { correct: true },
  });
  return latest.length === SPLITTER_RUN && latest.every((a) => a.correct);
}

export async function earnedRootRaiser(userId: string): Promise<boolean> {
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId, objective: 'O6' },
    select: { objective: true, correct: true, firstAttempt: true, hintsUsed: true },
  });
  const mastery = objectiveMastery(
    attempts.map((a) => ({ ...a, objective: a.objective as ObjectiveId })),
  );
  return mastery.find((o) => o.objective === 'O6')?.status === 'mastered';
}

export const BADGE_RULES: Record<BadgeId, (userId: string) => Promise<boolean>> = {
  explorer: earnedExplorer,
  splitter: earnedSplitter,
  rootRaiser: earnedRootRaiser,
  lectureReady: passedReadyCheck,
};

export async function checkBadges(userId: string): Promise<BadgeId[]> {
  const held = new Set(
    (await prisma.userBadge.findMany({ where: { userId }, select: { badge: true } })).map(
      (b) => b.badge,
    ),
  );
  const awarded: BadgeId[] = [];
  for (const { id } of BADGES) {
    if (held.has(id) || !(await BADGE_RULES[id](userId))) continue;
    try {
      await prisma.userBadge.create({ data: { userId, badge: id } });
      awarded.push(id);
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
    }
  }
  return awarded;
}

export async function badgesFor(userId: string): Promise<Badge[]> {
  const rows = await prisma.userBadge.findMany({ where: { userId } });
  const awardedAt = new Map(rows.map((r) => [r.badge, r.awardedAt.toISOString()]));
  return BADGES.map(({ id, label, description }) => ({
    id,
    label,
    description,
    awardedAt: awardedAt.get(id) ?? null,
  }));
}
