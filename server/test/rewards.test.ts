import type { Express } from 'express';
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

const DAY_MS = 24 * 60 * 60 * 1000;

describe.skipIf(!hasDb)('rewards (database)', () => {
  let app: Express;
  const ids: string[] = [];

  const newStudent = async (name = 'Rewards'): Promise<Student> => {
    const s = await student(app, name);
    ids.push(s.id);
    return s;
  };

  const practisedDaysAgo = async (userId: string, ...daysAgo: number[]) => {
    const prisma = await getPrisma();
    await prisma.quizAttempt.createMany({
      data: daysAgo.map((d) => ({
        userId,
        itemId: `past-${d}`,
        objective: 'O1',
        correct: true,
        firstAttempt: true,
        hintsUsed: 0,
        createdAt: new Date(Date.now() - d * DAY_MS),
      })),
    });
  };

  const answer = (
    s: Student,
    itemId: string,
    { correct = true, hintsUsed = 0, objective = 'O1' } = {},
  ) =>
    s.agent
      .post('/api/attempts')
      .send({ itemId, objective, correct, firstAttempt: true, hintsUsed })
      .expect(201);

  const readyItem = (n: number) => ({ itemId: `r-o${n}`, objective: `O${n}` });

  const leafRows = async (userId: string, reason: 'streak' | 'readyCheck' | 'lesson') =>
    (await getPrisma()).leafTransaction.findMany({ where: { userId, reason } });

  beforeAll(async () => {
    app = await makeApp();
  });

  afterAll(async () => {
    await removeStudents(ids);
    await closeDb();
  });

  describe('lesson leaves (2.1)', () => {
    it('pays lesson leaves once when two requests complete the same module in parallel', async () => {
      const s = await newStudent();
      const body = { modules: [{ moduleId: 1, part: 1, completed: true }] };
      const results = await Promise.all([
        s.agent.put('/api/progress').send(body),
        s.agent.put('/api/progress').send(body),
      ]);
      expect(results.map((r) => r.status)).toEqual([200, 200]);
      const res = await s.agent.get('/api/leaves').expect(200);
      expect(res.body.balance).toBe(30);
      expect(await leafRows(s.id, 'lesson')).toHaveLength(1);
    });
  });

  describe('streak bonus (2.2)', () => {
    it('pays +15 once when a 3-day streak is reached', async () => {
      const s = await newStudent();
      await practisedDaysAgo(s.id, 1, 2);
      const first = await answer(s, 'q-streak-1');
      expect(first.body.bonuses).toEqual([{ reason: 'streak', amount: 15 }]);
      const second = await answer(s, 'q-streak-2');
      expect(second.body.bonuses).toEqual([]);
      expect(await leafRows(s.id, 'streak')).toHaveLength(1);
    });

    it('pays nothing for a 2-day streak', async () => {
      const s = await newStudent();
      await practisedDaysAgo(s.id, 1);
      const res = await answer(s, 'q-two-days');
      expect(res.body.bonuses).toEqual([]);
      expect(await leafRows(s.id, 'streak')).toHaveLength(0);
    });

    it('pays again after the streak breaks and is rebuilt', async () => {
      const s = await newStudent();
      const { awardStreakBonus } = await import('../src/lib/rewards');
      await practisedDaysAgo(s.id, 12, 11, 10);
      const old = await awardStreakBonus(s.id, new Date(Date.now() - 10 * DAY_MS));
      expect(old).toEqual({ reason: 'streak', amount: 15 });

      await practisedDaysAgo(s.id, 2, 1);
      const res = await answer(s, 'q-rebuilt');
      expect(res.body.bonuses).toEqual([{ reason: 'streak', amount: 15 }]);
      expect(await leafRows(s.id, 'streak')).toHaveLength(2);
    });

    it('GET /api/streak returns { days: 3 } after three days in a row', async () => {
      const s = await newStudent();
      await practisedDaysAgo(s.id, 1, 2);
      await answer(s, 'q-streak-today');
      const res = await s.agent.get('/api/streak').expect(200);
      expect(res.body).toEqual({ days: 3 });
    });
  });

  describe('ready-check bonus (2.4)', () => {
    it('pays +60 once when 7 of the 8 items are right on the first try without hints', async () => {
      const s = await newStudent();
      for (let n = 1; n <= 6; n += 1) {
        const res = await answer(s, readyItem(n).itemId, { objective: readyItem(n).objective });
        expect(res.body.bonuses).toEqual([]);
      }
      const seventh = await answer(s, readyItem(7).itemId, { objective: readyItem(7).objective });
      expect(seventh.body.bonuses).toEqual([{ reason: 'readyCheck', amount: 60 }]);
      const eighth = await answer(s, readyItem(8).itemId, { objective: readyItem(8).objective });
      expect(eighth.body.bonuses).toEqual([]);
      expect(await leafRows(s.id, 'readyCheck')).toHaveLength(1);
    });

    it('pays nothing for 6 of 8', async () => {
      const s = await newStudent();
      for (let n = 1; n <= 8; n += 1) {
        await answer(s, readyItem(n).itemId, {
          objective: readyItem(n).objective,
          correct: n <= 6,
        });
      }
      expect(await leafRows(s.id, 'readyCheck')).toHaveLength(0);
    });

    it('does not count answers that used hints', async () => {
      const s = await newStudent();
      for (let n = 1; n <= 8; n += 1) {
        await answer(s, readyItem(n).itemId, {
          objective: readyItem(n).objective,
          hintsUsed: n <= 6 ? 0 : 1,
        });
      }
      expect(await leafRows(s.id, 'readyCheck')).toHaveLength(0);
    });

    it('never pays readyCheck for items outside the ready check', async () => {
      const s = await newStudent();
      for (let n = 1; n <= 8; n += 1) {
        const res = await answer(s, `q-other-${n}`, { objective: `O${n}` });
        expect(res.body.bonuses).toEqual([]);
      }
      expect(await leafRows(s.id, 'readyCheck')).toHaveLength(0);
    });
  });
});
