import { DECORATIONS } from '@btree/shared';
import type { Express } from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  closeDb,
  completeModules,
  ensureCatalogue,
  getPrisma,
  giveLeaves,
  hasDb,
  makeApp,
  removeStudents,
  student,
  type Db,
} from './helpers';

describe.skipIf(!hasDb)('grove routes (database)', () => {
  let app: Express;
  let prisma: Db;
  const created: string[] = [];

  const fresh = async (name: string) => {
    const s = await student(app, name);
    created.push(s.id);
    return s;
  };

  beforeAll(async () => {
    app = await makeApp();
    prisma = await getPrisma();
    await ensureCatalogue();
  });

  afterAll(async () => {
    await removeStudents(created);
    await closeDb();
  });

  describe('GET /api/leaves', () => {
    it('returns the balance and transactions newest first', async () => {
      const s = await fresh('Leaves');
      await prisma.leafTransaction.createMany({
        data: [
          { userId: s.id, amount: 10, reason: 'lesson', createdAt: new Date(Date.now() - 60_000) },
          { userId: s.id, amount: 20, reason: 'firstTry', createdAt: new Date() },
        ],
      });

      const res = await s.agent.get('/api/leaves').expect(200);

      expect(res.body.balance).toBe(30);
      expect(res.body.transactions.map((t: { amount: number }) => t.amount)).toEqual([20, 10]);
      expect(res.body.transactions[0].reason).toBe('firstTry');
      expect(typeof res.body.transactions[0].createdAt).toBe('string');
    });
  });

  describe('GET /api/decorations', () => {
    it('lists the catalogue with owned flags', async () => {
      const s = await fresh('Catalogue');
      await prisma.userDecoration.create({ data: { userId: s.id, decorationId: 'apples' } });

      const res = await s.agent.get('/api/decorations').expect(200);
      const rows = res.body as { id: string; cost: number; owned: boolean; placed: boolean }[];

      expect(rows.map((d) => d.id).sort()).toEqual(DECORATIONS.map((d) => d.id).sort());
      expect(rows.filter((d) => d.owned).map((d) => d.id)).toEqual(['apples']);
      expect(rows.filter((d) => d.placed).map((d) => d.id)).toEqual(['apples']);
      const costs = rows.map((d) => d.cost);
      expect(costs).toEqual([...costs].sort((x, y) => x - y));
    });

    it('reports a decoration taken off the tree as owned but not placed', async () => {
      const s = await fresh('Unplacer');
      await prisma.userDecoration.createMany({
        data: [
          { userId: s.id, decorationId: 'apples' },
          { userId: s.id, decorationId: 'bunting' },
        ],
      });

      await s.agent
        .put('/api/grove/placement')
        .send({ items: [{ decorationId: 'bunting', placed: false }] })
        .expect(204);
      const rows = (await s.agent.get('/api/decorations').expect(200)).body as {
        id: string;
        owned: boolean;
        placed: boolean;
      }[];

      expect(rows.find((d) => d.id === 'apples')).toMatchObject({ owned: true, placed: true });
      expect(rows.find((d) => d.id === 'bunting')).toMatchObject({ owned: true, placed: false });
      expect(rows.find((d) => d.id === 'songbird')).toMatchObject({ owned: false, placed: false });
    });
  });

  describe('POST /api/decorations/:id/purchase', () => {
    it('returns 404 for an unknown decoration', async () => {
      const s = await fresh('Unknown');

      const res = await s.agent.post('/api/decorations/no-such-thing/purchase').expect(404);

      expect(res.body.error).toBe('Decoration not found');
    });

    it('returns 409 when the decoration is already owned', async () => {
      const s = await fresh('Owner');
      await prisma.userDecoration.create({ data: { userId: s.id, decorationId: 'butterflies' } });
      await giveLeaves(s.id, 500);

      const res = await s.agent.post('/api/decorations/butterflies/purchase').expect(409);

      expect(res.body.error).toBe('You already own this decoration');
    });

    it("returns 400 'Not enough leaves yet' when the balance is too low", async () => {
      const s = await fresh('Broke');
      await completeModules(s.id, 1);
      await giveLeaves(s.id, 10);

      const res = await s.agent.post('/api/decorations/butterflies/purchase').expect(400);

      expect(res.body.error).toBe('Not enough leaves yet');
      expect(
        await prisma.userDecoration.count({ where: { userId: s.id, decorationId: 'butterflies' } }),
      ).toBe(0);
    });

    it('returns 201, deducts exactly the cost and records a purchase transaction', async () => {
      const s = await fresh('Buyer');
      const butterflies = DECORATIONS.find((d) => d.id === 'butterflies')!;
      await completeModules(s.id, 1);
      await giveLeaves(s.id, 100);

      const res = await s.agent.post('/api/decorations/butterflies/purchase').expect(201);

      expect(res.body.balance).toBe(100 - butterflies.cost);
      const purchase = await prisma.leafTransaction.findFirst({
        where: { userId: s.id, reason: 'purchase' },
      });
      expect(purchase?.amount).toBe(-butterflies.cost);
      const owned = await prisma.userDecoration.findUnique({
        where: { userId_decorationId: { userId: s.id, decorationId: 'butterflies' } },
      });
      expect(owned?.placed).toBe(true);
    });
  });

  describe('PUT /api/grove/placement', () => {
    it("updates only the caller's decorations", async () => {
      const a = await fresh('Placer A');
      const b = await fresh('Placer B');
      await prisma.userDecoration.createMany({
        data: [
          { userId: a.id, decorationId: 'apples' },
          { userId: b.id, decorationId: 'apples' },
        ],
      });

      await a.agent
        .put('/api/grove/placement')
        .send({ items: [{ decorationId: 'apples', placed: false, x: 10, y: 20 }] })
        .expect(204);

      const mine = await prisma.userDecoration.findUniqueOrThrow({
        where: { userId_decorationId: { userId: a.id, decorationId: 'apples' } },
      });
      const theirs = await prisma.userDecoration.findUniqueOrThrow({
        where: { userId_decorationId: { userId: b.id, decorationId: 'apples' } },
      });
      expect(mine).toMatchObject({ placed: false, x: 10, y: 20 });
      expect(theirs).toMatchObject({ placed: true, x: null, y: null });
    });

    it('returns saved positions, and null resets one to its default spot', async () => {
      const s = await fresh('Mover');
      await prisma.userDecoration.create({ data: { userId: s.id, decorationId: 'apples' } });

      await s.agent
        .put('/api/grove/placement')
        .send({ items: [{ decorationId: 'apples', placed: true, x: -40.5, y: 12 }] })
        .expect(204);
      const moved = (await s.agent.get('/api/decorations').expect(200)).body.find(
        (d: { id: string }) => d.id === 'apples',
      );
      expect(moved).toMatchObject({ owned: true, placed: true, x: -40.5, y: 12 });

      await s.agent
        .put('/api/grove/placement')
        .send({ items: [{ decorationId: 'apples', placed: true, x: null, y: null }] })
        .expect(204);
      const reset = (await s.agent.get('/api/decorations').expect(200)).body.find(
        (d: { id: string }) => d.id === 'apples',
      );
      expect(reset).toMatchObject({ x: null, y: null });
    });

    it('rejects a position far outside the scene with 400', async () => {
      const s = await fresh('Far');
      await s.agent
        .put('/api/grove/placement')
        .send({ items: [{ decorationId: 'apples', placed: true, x: 5000, y: 0 }] })
        .expect(400);
    });

    it('rejects more than 50 items with 400', async () => {
      const s = await fresh('Too many');
      const items = Array.from({ length: 51 }, () => ({ decorationId: 'apples', placed: true }));

      const res = await s.agent.put('/api/grove/placement').send({ items }).expect(400);

      expect(res.body.error).toBe('Invalid request body');
    });
  });

  describe('lecture questions', () => {
    it('creates a question (201)', async () => {
      const s = await fresh('Asker');

      const res = await s.agent
        .post('/api/lecture-questions')
        .send({ text: 'Why is the minimum ceil(m/2)?' })
        .expect(201);

      expect(res.body).toMatchObject({ text: 'Why is the minimum ceil(m/2)?' });
      expect(typeof res.body.id).toBe('string');
      expect(typeof res.body.createdAt).toBe('string');
    });

    it('lists questions in the order they were created', async () => {
      const s = await fresh('Lister');
      await prisma.lectureQuestion.createMany({
        data: [
          { userId: s.id, text: 'second', createdAt: new Date(Date.now() - 1_000) },
          { userId: s.id, text: 'first', createdAt: new Date(Date.now() - 60_000) },
          { userId: s.id, text: 'third', createdAt: new Date() },
        ],
      });

      const res = await s.agent.get('/api/lecture-questions').expect(200);

      expect(res.body.map((q: { text: string }) => q.text)).toEqual(['first', 'second', 'third']);
    });

    it('deletes your own question (204)', async () => {
      const s = await fresh('Deleter');
      const created = await s.agent
        .post('/api/lecture-questions')
        .send({ text: 'Delete me' })
        .expect(201);

      await s.agent.delete(`/api/lecture-questions/${created.body.id}`).expect(204);

      const res = await s.agent.get('/api/lecture-questions').expect(200);
      expect(res.body).toEqual([]);
    });

    it("returns 404 when deleting someone else's question", async () => {
      const owner = await fresh('Owner');
      const other = await fresh('Other');
      const created = await owner.agent
        .post('/api/lecture-questions')
        .send({ text: 'Mine' })
        .expect(201);

      await other.agent.delete(`/api/lecture-questions/${created.body.id}`).expect(404);

      expect(await prisma.lectureQuestion.count({ where: { id: created.body.id } })).toBe(1);
    });

    it('rejects text over 280 characters with 400', async () => {
      const s = await fresh('Wordy');

      const res = await s.agent
        .post('/api/lecture-questions')
        .send({ text: 'x'.repeat(281) })
        .expect(400);

      expect(res.body.error).toBe('Invalid request body');
      expect(await prisma.lectureQuestion.count({ where: { userId: s.id } })).toBe(0);
    });
  });
});
