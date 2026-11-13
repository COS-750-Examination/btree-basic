import { RUN_GAP_MINUTES, type QuizAttemptBody } from '@btree/shared';
import { prisma } from './prisma';

export interface TrustedAttemptFields {
  firstAttempt: boolean;
  hintsUsed: number;
}

export async function trustedAttempt(
  userId: string,
  claim: QuizAttemptBody,
  now: Date = new Date(),
): Promise<TrustedAttemptFields> {
  const latest = await prisma.quizAttempt.findFirst({
    where: { userId, itemId: claim.itemId },
    orderBy: { createdAt: 'desc' },
    select: { correct: true, createdAt: true },
  });
  const gapStart = new Date(now.getTime() - RUN_GAP_MINUTES * 60 * 1000);
  const recent = latest !== null && latest.createdAt >= gapStart;
  const newRun = !latest || latest.correct || !recent;
  const since = latest?.correct && recent ? latest.createdAt : gapStart;

  const views = await prisma.hintView.findMany({
    where: { userId, itemId: claim.itemId, createdAt: { gt: since } },
    select: { hint: true },
    distinct: ['hint'],
  });

  return {
    firstAttempt: claim.firstAttempt && newRun,
    hintsUsed: Math.min(3, Math.max(claim.hintsUsed, views.length)),
  };
}
