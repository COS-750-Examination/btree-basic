import { prisma } from './prisma';

export async function exportUserData(userId: string) {
  const [
    user,
    modules,
    attempts,
    mastery,
    leaves,
    decorations,
    lectureQuestions,
    warmups,
    hintViews,
    badges,
    friendships,
    cheersSent,
    cheersReceived,
  ] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        email: true,
        displayName: true,
        theme: true,
        inviteCode: true,
        plantedAt: true,
        createdAt: true,
      },
    }),
    prisma.moduleProgress.findMany({
      where: { userId },
      orderBy: { moduleId: 'asc' },
      select: { moduleId: true, part: true, completedAt: true },
    }),
    prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: {
        itemId: true,
        objective: true,
        correct: true,
        firstAttempt: true,
        hintsUsed: true,
        confidence: true,
        misconception: true,
        createdAt: true,
      },
    }),
    prisma.mastery.findMany({
      where: { userId },
      orderBy: { objective: 'asc' },
      select: { objective: true, score: true, counted: true, updatedAt: true },
    }),
    prisma.leafTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { amount: true, reason: true, createdAt: true },
    }),
    prisma.userDecoration.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { decorationId: true, placed: true, x: true, y: true, createdAt: true },
    }),
    prisma.lectureQuestion.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { text: true, createdAt: true },
    }),
    prisma.warmupResult.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { correct: true, total: true, needsRecap: true, createdAt: true },
    }),
    prisma.hintView.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { itemId: true, hint: true, createdAt: true },
    }),
    prisma.userBadge.findMany({
      where: { userId },
      orderBy: { awardedAt: 'asc' },
      select: { badge: true, awardedAt: true },
    }),
    prisma.friendship.findMany({
      where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
      orderBy: { createdAt: 'asc' },
      select: {
        requesterId: true,
        status: true,
        createdAt: true,
        acceptedAt: true,
        requester: { select: { displayName: true } },
        addressee: { select: { displayName: true } },
      },
    }),
    prisma.cheer.findMany({
      where: { fromId: userId },
      orderBy: { createdAt: 'asc' },
      select: {
        message: true,
        moduleId: true,
        createdAt: true,
        to: { select: { displayName: true } },
      },
    }),
    prisma.cheer.findMany({
      where: { toId: userId },
      orderBy: { createdAt: 'asc' },
      select: {
        message: true,
        moduleId: true,
        createdAt: true,
        from: { select: { displayName: true } },
      },
    }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    user,
    modules,
    attempts,
    mastery,
    leaves,
    decorations,
    lectureQuestions,
    warmups,
    hintViews,
    badges,
    friendships: friendships.map((f) => {
      const sent = f.requesterId === userId;
      return {
        friendName: sent ? f.addressee.displayName : f.requester.displayName,
        status: f.status,
        direction: sent ? 'sent' : 'received',
        createdAt: f.createdAt,
        acceptedAt: f.acceptedAt,
      };
    }),
    cheersSent: cheersSent.map(({ to, ...c }) => ({ toName: to.displayName, ...c })),
    cheersReceived: cheersReceived.map(({ from, ...c }) => ({ fromName: from.displayName, ...c })),
  };
}

export type UserExport = Awaited<ReturnType<typeof exportUserData>>;
