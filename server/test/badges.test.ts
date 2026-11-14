import { BADGES, type BadgeId } from '@btree/shared';
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  closeDb,
  completeModules,
  getPrisma,
  hasDb,
  makeApp,
  removeStudents,
  student,
  type Db,
  type Student,
} from './helpers';

describe.skipIf(!hasDb)('badges (database)', () => {
  let app: Express;
  let prisma: Db;
  let checkBadges: (userId: string) => Promise<BadgeId[]>;
  const ids: string[] = [];

  const newStudent = async (name = 'Badges'): Promise<Student> => {
    const s = await student(app, name);
    ids.push(s.id);
    return s;
  };

  const doWarmup = (userId: string) =>
    prisma.warmupResult.create({ data: { userId, correct: 5, total: 5, needsRecap: false } });

  const answers = (userId: string, objective: string, results: boolean[], hintsUsed = 0) => {
    const start = Date.now() - results.length * 1000;
    return prisma.quizAttempt.createMany({
      data: results.map((correct, i) => ({
        userId,
        itemId: `${objective}-${i}`,
        objective,
        correct,
        firstAttempt: true,
        hintsUsed,
        createdAt: new Date(start + i * 1000),
      })),
    });
  };

  const readyCheck = (userId: string, correctCount: number) =>
    prisma.quizAttempt.createMany({
      data: Array.from({ length: 8 }, (_, i) => ({
        userId,
        itemId: `r-o${i + 1}`,
        objective: `O${i + 1}`,
        correct: i < correctCount,
        firstAttempt: true,
        hintsUsed: 0,
      })),
    });

  beforeAll(async () => {
    app = await makeApp();
    prisma = await getPrisma();
    ({ checkBadges } = await import('../src/lib/badges'));
  });

  afterAll(async () => {
    await removeStudents(ids);
    await closeDb();
  });

  describe('badge rules (3.1)', () => {
    describe('Explorer', () => {
      it('is earned once the warm-up is done and module 1 is complete', async () => {
        const s = await newStudent();
        await doWarmup(s.id);
        await completeModules(s.id, 1);
        expect(await checkBadges(s.id)).toEqual(['explorer']);
      });

      it('is not earned before module 1 is complete', async () => {
        const s = await newStudent();
        await doWarmup(s.id);
        expect(await checkBadges(s.id)).toEqual([]);
      });
    });

    describe('Splitter', () => {
      it('is earned when the 3 latest O5 answers are all correct', async () => {
        const s = await newStudent();
        await answers(s.id, 'O5', [false, true, true, true]);
        expect(await checkBadges(s.id)).toEqual(['splitter']);
      });

      it('is not earned when one of the 3 latest O5 answers is wrong', async () => {
        const s = await newStudent();
        await answers(s.id, 'O5', [true, true, true, false]);
        expect(await checkBadges(s.id)).toEqual([]);
      });
    });

    describe('Root Raiser', () => {
      it('is earned when O6 is mastered', async () => {
        const s = await newStudent();
        await answers(s.id, 'O6', [true, true, true]);
        expect(await checkBadges(s.id)).toEqual(['rootRaiser']);
      });

      it('is not earned while O6 is still getting there', async () => {
        const s = await newStudent();
        await answers(s.id, 'O6', [true, true, false]);
        expect(await checkBadges(s.id)).toEqual([]);
      });
    });

    describe('Lecture Ready', () => {
      it('is earned when the ready check is passed (7 of 8)', async () => {
        const s = await newStudent();
        await readyCheck(s.id, 7);
        expect(await checkBadges(s.id)).toEqual(['lectureReady']);
      });

      it('is not earned with 6 of 8', async () => {
        const s = await newStudent();
        await readyCheck(s.id, 6);
        expect(await checkBadges(s.id)).toEqual([]);
      });
    });

    it('awards each badge only once, even when checked twice', async () => {
      const s = await newStudent();
      await doWarmup(s.id);
      await completeModules(s.id, 1);
      const parallel = await Promise.all([checkBadges(s.id), checkBadges(s.id)]);
      expect(parallel.flat()).toEqual(['explorer']);
      expect(await checkBadges(s.id)).toEqual([]);
      expect(await prisma.userBadge.count({ where: { userId: s.id } })).toBe(1);
    });
  });

  describe('GET /api/badges (3.2)', () => {
    it('returns all four badges in BADGES order, locked ones with awardedAt null', async () => {
      const s = await newStudent();
      const res = await s.agent.get('/api/badges').expect(200);
      expect(res.body).toEqual(BADGES.map((b) => ({ ...b, awardedAt: null })));
    });

    it('shows Explorer after the warm-up and module 1 are saved through the API', async () => {
      const s = await newStudent();
      await s.agent
        .post('/api/warmup')
        .send({ answers: [{ itemId: 'w1', correct: true }] })
        .expect(201);
      await s.agent
        .put('/api/progress')
        .send({ modules: [{ moduleId: 1, part: 1, completed: true }] })
        .expect(200);
      const res = await s.agent.get('/api/badges').expect(200);
      const earned = res.body.filter((b: { awardedAt: string | null }) => b.awardedAt !== null);
      expect(earned.map((b: { id: string }) => b.id)).toEqual(['explorer']);
      expect(Number.isNaN(Date.parse(earned[0].awardedAt))).toBe(false);
    });

    it('shows Splitter after three correct O5 answers through the API', async () => {
      const s = await newStudent();
      for (const itemId of ['split-1', 'split-2', 'split-3']) {
        await s.agent
          .post('/api/attempts')
          .send({ itemId, objective: 'O5', correct: true, firstAttempt: true, hintsUsed: 0 })
          .expect(201);
      }
      const res = await s.agent.get('/api/badges').expect(200);
      const splitter = res.body.find((b: { id: string }) => b.id === 'splitter');
      expect(splitter.awardedAt).not.toBeNull();
    });

    it('requires sign-in (401)', async () => {
      await request(app).get('/api/badges').expect(401);
    });
  });
});
