import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  closeDb,
  getPrisma,
  hasDb,
  makeApp,
  removeStudents,
  student,
  type Student,
} from './helpers';

describe.skipIf(!hasDb)('attempt integrity (database)', () => {
  let app: Express;
  const ids: string[] = [];

  const newStudent = async (name = 'Attempts'): Promise<Student> => {
    const s = await student(app, name);
    ids.push(s.id);
    return s;
  };

  const attempt = (
    s: Student,
    itemId: string,
    { correct = true, firstAttempt = true, hintsUsed = 0 } = {},
  ) =>
    s.agent
      .post('/api/attempts')
      .send({ itemId, objective: 'O5', correct, firstAttempt, hintsUsed })
      .expect(201);

  const latestAttempt = async (userId: string, itemId: string) =>
    (await getPrisma()).quizAttempt.findFirstOrThrow({
      where: { userId, itemId },
      orderBy: { createdAt: 'desc' },
    });

  const leafReasons = async (userId: string) => {
    const prisma = await getPrisma();
    const rows = await prisma.leafTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((t) => t.reason);
  };

  beforeAll(async () => {
    app = await makeApp();
  });

  afterAll(async () => {
    await removeStudents(ids);
    await closeDb();
  });

  describe('POST /api/attempts', () => {
    it('does not let a retry after a wrong answer claim firstAttempt', async () => {
      const s = await newStudent();
      await attempt(s, 'retry', { correct: false });
      const res = await attempt(s, 'retry', { correct: true, firstAttempt: true });
      expect(res.body.counted).toBe(1);
      expect(res.body.score).toBe(0);
      expect((await latestAttempt(s.id, 'retry')).firstAttempt).toBe(false);
      expect(await leafReasons(s.id)).toEqual(['withHint']);
    });

    it('counts a hint viewed before answering even when the client sends hintsUsed 0', async () => {
      const s = await newStudent();
      await s.agent.post('/api/hints').send({ itemId: 'hinted', hint: 1 }).expect(201);
      const res = await attempt(s, 'hinted', { hintsUsed: 0 });
      expect(res.body.counted).toBe(0);
      expect((await latestAttempt(s.id, 'hinted')).hintsUsed).toBe(1);
      expect(await leafReasons(s.id)).toEqual(['hintRead', 'withHint']);
    });

    it('counts a retake as a first attempt after the item was answered correctly', async () => {
      const s = await newStudent();
      await attempt(s, 'retake');
      const res = await attempt(s, 'retake');
      expect(res.body.counted).toBe(2);
      expect((await latestAttempt(s.id, 'retake')).firstAttempt).toBe(true);
    });

    it('counts an attempt as a first attempt again after the 30-minute gap', async () => {
      const s = await newStudent();
      const prisma = await getPrisma();
      await prisma.quizAttempt.create({
        data: {
          userId: s.id,
          itemId: 'gap',
          objective: 'O5',
          correct: false,
          firstAttempt: true,
          hintsUsed: 0,
          createdAt: new Date(Date.now() - 31 * 60 * 1000),
        },
      });
      const res = await attempt(s, 'gap');
      expect(res.body.counted).toBe(2);
      expect((await latestAttempt(s.id, 'gap')).firstAttempt).toBe(true);
    });

    it('pays leaves only for the first correct answer to a question, but still counts the retake', async () => {
      const s = await newStudent();
      await attempt(s, 'once');
      const retake = await attempt(s, 'once');
      expect(retake.body.counted).toBe(2);
      expect(await leafReasons(s.id)).toEqual(['firstTry']);
    });

    it('pays nothing on a perfect retake when the first correct answer needed a retry', async () => {
      const s = await newStudent();
      await attempt(s, 'second-go', { correct: false });
      await attempt(s, 'second-go', { firstAttempt: false });
      await attempt(s, 'second-go');
      expect(await leafReasons(s.id)).toEqual(['withHint']);
    });
  });

  describe('POST /api/hints', () => {
    it('pays hintRead once per item and hint', async () => {
      const s = await newStudent();
      for (let i = 0; i < 5; i += 1) {
        await s.agent.post('/api/hints').send({ itemId: 'farm', hint: 1 }).expect(201);
      }
      const res = await s.agent.get('/api/leaves').expect(200);
      expect(res.body.balance).toBe(5);
    });

    it('pays hintRead again for a different hint of the same item', async () => {
      const s = await newStudent();
      await s.agent.post('/api/hints').send({ itemId: 'ladder', hint: 1 }).expect(201);
      await s.agent.post('/api/hints').send({ itemId: 'ladder', hint: 2 }).expect(201);
      await s.agent.post('/api/hints').send({ itemId: 'ladder', hint: 1 }).expect(201);
      const res = await s.agent.get('/api/leaves').expect(200);
      expect(res.body.balance).toBe(10);
    });

    it('rejects a body without itemId with 400', async () => {
      const s = await newStudent();
      await s.agent.post('/api/hints').send({ hint: 1 }).expect(400);
    });
  });

  it('GET /api/attempts returns only your own answers, oldest first', async () => {
    const s = await newStudent('History');
    const other = await newStudent('Someone else');
    await attempt(s, 'm6-q1', { correct: false }).expect(201);
    await attempt(s, 'm6-q2').expect(201);
    await attempt(other, 'm6-q3').expect(201);

    const res = await s.agent.get('/api/attempts').expect(200);
    const rows = res.body as { itemId: string; objective: string; correct: boolean; at: string }[];

    expect(rows.map((r) => r.itemId)).toEqual(['m6-q1', 'm6-q2']);
    expect(rows[0]).toMatchObject({ objective: 'O5', correct: false, firstAttempt: true });
    expect(Number.isNaN(Date.parse(rows[0]!.at))).toBe(false);
  });

  it('GET /api/attempts needs a session', async () => {
    await request(app).get('/api/attempts').expect(401);
  });
});
