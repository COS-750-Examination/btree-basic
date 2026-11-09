import {
  ProgressPutBody,
  QuizAttemptBody,
  WarmupBody,
  objectiveMastery,
  type ObjectiveId,
} from '@btree/shared';
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { awardLeaves, readinessFor } from '../lib/progress';
import { requireAuth, uid } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

/** FR11: lesson progress, quiz attempts, mastery and readiness. Mounted at /api. */
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
    if (newlyCompleted) await awardLeaves(userId, 'lesson');
  }
  res.json(await readinessFor(userId));
});

progressRouter.post('/attempts', requireAuth, validateBody(QuizAttemptBody), async (req, res) => {
  const userId = uid(req);
  const a = req.body as QuizAttemptBody;
  await prisma.quizAttempt.create({ data: { userId, ...a } });

  if (a.correct)
    await awardLeaves(userId, a.firstAttempt && a.hintsUsed === 0 ? 'firstTry' : 'withHint');

  // Refresh the cached mastery row for this objective.
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
  res.status(201).json(m);
});

progressRouter.post('/hints', requireAuth, async (req, res) => {
  await awardLeaves(uid(req), 'hintRead');
  res.status(201).json({ ok: true });
});

progressRouter.get('/mastery', requireAuth, async (req, res) => {
  res.json((await readinessFor(uid(req))).objectives);
});

progressRouter.get('/readiness', requireAuth, async (req, res) => {
  res.json(await readinessFor(uid(req)));
});

/** Warm-up result decides whether module 2 (search trees recap) is added to the path. */
progressRouter.post('/warmup', requireAuth, validateBody(WarmupBody), async (req, res) => {
  const { answers } = req.body as WarmupBody;
  const correct = answers.filter((a) => a.correct).length;
  const needsRecap = correct < Math.ceil(answers.length * 0.6);
  await prisma.warmupResult.create({
    data: { userId: uid(req), correct, total: answers.length, needsRecap },
  });
  res.status(201).json({ correct, total: answers.length, needsRecap });
});
