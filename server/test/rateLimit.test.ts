import { randomUUID } from 'node:crypto';
import { CHEERS_PER_HOUR, FRIEND_REQUESTS_PER_HOUR } from '@btree/shared';
import type { Express } from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  befriend,
  closeDb,
  hasDb,
  makeApp,
  removeStudents,
  student,
  type Student,
} from './helpers';

describe.skipIf(!hasDb)('per-student rate limits (database)', () => {
  let app: Express;
  let message: string;
  const ids: string[] = [];

  const newStudent = async (name = 'Limited'): Promise<Student> => {
    const s = await student(app, name);
    ids.push(s.id);
    return s;
  };

  const askStranger = (s: Student) =>
    s.agent.post('/api/friends/requests').send({ email: `nobody-${randomUUID()}@btree.local` });

  beforeAll(async () => {
    app = await makeApp();
    ({ RATE_LIMIT_MESSAGE: message } = await import('../src/lib/rateLimit'));
  });

  afterAll(async () => {
    await removeStudents(ids);
    await closeDb();
  });

  describe('POST /api/friends/requests', () => {
    it('returns 429 with the slow-down message on the 11th request in an hour', async () => {
      const s = await newStudent();
      for (let i = 0; i < FRIEND_REQUESTS_PER_HOUR; i += 1) {
        await askStranger(s).expect(202);
      }
      const res = await askStranger(s).expect(429);
      expect(res.body).toEqual({ error: message });
    });

    it('does not limit other students', async () => {
      const noisy = await newStudent('Noisy');
      const quiet = await newStudent('Quiet');
      for (let i = 0; i < FRIEND_REQUESTS_PER_HOUR; i += 1) {
        await askStranger(noisy).expect(202);
      }
      await askStranger(noisy).expect(429);
      await askStranger(quiet).expect(202);
    });
  });

  describe('POST /api/friends/:id/cheers', () => {
    it('returns 429 on the 21st cheer in an hour', async () => {
      const a = await newStudent('Cheerer');
      const b = await newStudent('Cheered');
      await befriend(a, b);
      for (let i = 0; i < CHEERS_PER_HOUR; i += 1) {
        await a.agent.post(`/api/friends/${b.id}/cheers`).send({}).expect(201);
      }
      const res = await a.agent.post(`/api/friends/${b.id}/cheers`).send({}).expect(429);
      expect(res.body).toEqual({ error: message });
    });
  });
});
