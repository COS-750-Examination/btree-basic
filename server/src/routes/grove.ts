import {
  GROWTH_STAGES,
  LectureQuestionBody,
  decorationMinStage,
  reachedStage,
} from '@btree/shared';
import { Router } from 'express';
import { z } from 'zod';
import { HttpError, notFound, param } from '../lib/http';
import { prisma } from '../lib/prisma';
import { leafBalance, stageOf } from '../lib/progress';
import { requireAuth, uid } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

/** Leaves, decorations and lecture notes. Mounted at /api. */
export const groveRouter = Router();

groveRouter.get('/leaves', requireAuth, async (req, res) => {
  const userId = uid(req);
  const [balance, transactions] = await Promise.all([
    leafBalance(userId),
    prisma.leafTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);
  res.json({
    balance,
    transactions: transactions.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })),
  });
});

groveRouter.get('/decorations', requireAuth, async (req, res) => {
  const [all, owned] = await Promise.all([
    prisma.decoration.findMany({ orderBy: { cost: 'asc' } }),
    prisma.userDecoration.findMany({ where: { userId: uid(req) }, select: { decorationId: true } }),
  ]);
  const ownedIds = new Set(owned.map((o) => o.decorationId));
  res.json(all.map((d) => ({ ...d, owned: ownedIds.has(d.id) })));
});

groveRouter.post('/decorations/:id/purchase', requireAuth, async (req, res) => {
  const userId = uid(req);
  const decoration = await prisma.decoration.findUnique({ where: { id: param(req, 'id') } });
  if (!decoration) throw notFound('Decoration not found');
  if (
    await prisma.userDecoration.findUnique({
      where: { userId_decorationId: { userId, decorationId: decoration.id } },
    })
  ) {
    throw new HttpError(409, 'You already own this decoration');
  }
  const minStage = decorationMinStage(decoration.id);
  if (minStage && !reachedStage(await stageOf(userId), minStage)) {
    const label = GROWTH_STAGES.find((s) => s.id === minStage)!.label.toLowerCase();
    throw new HttpError(409, `This unlocks when your tree is a ${label}`);
  }
  if ((await leafBalance(userId)) < decoration.cost)
    throw new HttpError(400, 'Not enough leaves yet');
  await prisma.$transaction([
    prisma.leafTransaction.create({
      data: { userId, amount: -decoration.cost, reason: 'purchase' },
    }),
    prisma.userDecoration.create({ data: { userId, decorationId: decoration.id } }),
  ]);
  res.status(201).json({ balance: await leafBalance(userId) });
});

const Placement = z.object({
  items: z
    .array(
      z.object({
        decorationId: z.string(),
        placed: z.boolean(),
        x: z.number().optional(),
        y: z.number().optional(),
      }),
    )
    .max(50),
});

groveRouter.put('/grove/placement', requireAuth, validateBody(Placement), async (req, res) => {
  const userId = uid(req);
  const { items } = req.body as z.infer<typeof Placement>;
  for (const { decorationId, ...data } of items) {
    await prisma.userDecoration.updateMany({ where: { userId, decorationId }, data });
  }
  res.status(204).end();
});

groveRouter.get('/lecture-questions', requireAuth, async (req, res) => {
  const rows = await prisma.lectureQuestion.findMany({
    where: { userId: uid(req) },
    orderBy: { createdAt: 'asc' },
  });
  res.json(rows.map((q) => ({ id: q.id, text: q.text, createdAt: q.createdAt.toISOString() })));
});

groveRouter.post(
  '/lecture-questions',
  requireAuth,
  validateBody(LectureQuestionBody),
  async (req, res) => {
    const { text } = req.body as LectureQuestionBody;
    const q = await prisma.lectureQuestion.create({ data: { userId: uid(req), text } });
    res.status(201).json({ id: q.id, text: q.text, createdAt: q.createdAt.toISOString() });
  },
);

groveRouter.delete('/lecture-questions/:id', requireAuth, async (req, res) => {
  const { count } = await prisma.lectureQuestion.deleteMany({
    where: { id: param(req, 'id'), userId: uid(req) },
  });
  if (!count) throw notFound('Question not found');
  res.status(204).end();
});
