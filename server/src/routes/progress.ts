import {
  HintBody,
  ProgressPutBody,
  QuizAttemptBody,
  WarmupBody,
  objectiveMastery,
  type AttemptResult,
  type LeafBonus,
  type ObjectiveId,
  type StreakSummary,
} from '@btree/shared';
import { Router } from 'express';
import { trustedAttempt } from '../lib/attempts';
import { badgesFor, checkBadges } from '../lib/badges';
import { prisma } from '../lib/prisma';
import { awardLeaves, readinessFor, streakDays } from '../lib/progress';
import { awardReadyCheckBonus, awardStreakBonus, isReadyCheckItem } from '../lib/rewards';
import { requireAuth, uid } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

export const progressRouter = Router();

progressRouter.get('/progress', requireAuth, async (req, res) => {
  const rows = await prisma.moduleProgress.findMany({
    where: { userId: uid(req) },
    orderBy: { moduleId: 'asc' },
  });
  res.json({
    modules: rows.map((r) => ({
      moduleId: r.moduleId,
      part: r.part,
      completed: r.completedAt !== null,
    })),
  });
});

progressRouter.put('/progress', requireAuth, validateBody(ProgressPutBody), async (req, res) => {
  const userId = uid(req);
  const { modules } = req.body as ProgressPutBody;
  for (const m of modules) {
    const existing = await prisma.moduleProgress.findUnique({
      where: { userId_moduleId: { userId, moduleId: m.moduleId } },
    });
    const newlyCompleted = m.completed && !existing?.completedAt;
    await prisma.moduleProgress.upsert({
      where: { userId_moduleId: { userId, moduleId: m.moduleId } },
      create: {
        userId,
        moduleId: m.moduleId,
        part: m.part,
        completedAt: m.completed ? new Date() : null,
      },
      update: {
        part: Math.max(m.part, existing?.part ?? 1),
        ...(newlyCompleted ? { completedAt: new Date() } : {}),
      },
    });
    if (newlyCompleted) await awardLeaves(userId, 'lesson', `lesson:${m.moduleId}`);
  }
  await checkBadges(userId);
  res.json(await readinessFor(userId));
});

progressRouter.post('/attempts', requireAuth, validateBody(QuizAttemptBody), async (req, res) => {
  const userId = uid(req);
  const claim = req.body as QuizAttemptBody;
  const a = { ...claim, ...(await trustedAttempt(userId, claim)) };
  await prisma.quizAttempt.create({ data: { userId, ...a } });

  if (a.correct)
    await awardLeaves(
      userId,
      a.firstAttempt && a.hintsUsed === 0 ? 'firstTry' : 'withHint',
      `answer:${a.itemId}`,
    );

  const attempts = await prisma.quizAttempt.findMany({
    where: { userId, objective: a.objective },
    select: { objective: true, correct: true, firstAttempt: true, hintsUsed: true },
  });
  const m = objectiveMastery(
    attempts.map((x) => ({ ...x, objective: x.objective as ObjectiveId })),
  ).find((o) => o.objective === a.objective)!;
  await prisma.mastery.upsert({
    where: { userId_objective: { userId, objective: a.objective } },
    create: { userId, objective: a.objective, score: m.score, counted: m.counted },
    update: { score: m.score, counted: m.counted },
  });

  const bonuses: LeafBonus[] = [];
  const streak = await awardStreakBonus(userId);
  if (streak) bonuses.push(streak);
  if (isReadyCheckItem(a.itemId)) {
    const ready = await awardReadyCheckBonus(userId);
    if (ready) bonuses.push(ready);
  }

  await checkBadges(userId);
  const result: AttemptResult = { ...m, bonuses };
  res.status(201).json(result);
});

progressRouter.post('/hints', requireAuth, validateBody(HintBody), async (req, res) => {
  const userId = uid(req);
  const { itemId, hint } = req.body as HintBody;
  await prisma.hintView.create({ data: { userId, itemId, hint } });
  await awardLeaves(userId, 'hintRead', `hint:${itemId}:${hint}`);
  res.status(201).json({ ok: true });
});

progressRouter.get('/streak', requireAuth, async (req, res) => {
  const summary: StreakSummary = { days: await streakDays(uid(req)) };
  res.json(summary);
});

progressRouter.get('/badges', requireAuth, async (req, res) => {
  res.json(await badgesFor(uid(req)));
});

progressRouter.get('/mastery', requireAuth, async (req, res) => {
  res.json((await readinessFor(uid(req))).objectives);
});

progressRouter.get('/readiness', requireAuth, async (req, res) => {
  res.json(await readinessFor(uid(req)));
});

progressRouter.post('/warmup', requireAuth, validateBody(WarmupBody), async (req, res) => {
  const { answers } = req.body as WarmupBody;
  const correct = answers.filter((a) => a.correct).length;
  const needsRecap = correct < Math.ceil(answers.length * 0.6);
  await prisma.warmupResult.create({
    data: { userId: uid(req), correct, total: answers.length, needsRecap },
  });
  await checkBadges(uid(req));
  res.status(201).json({ correct, total: answers.length, needsRecap });
});
