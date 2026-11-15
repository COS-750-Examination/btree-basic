import { dailyMoves } from '@btree/engine';
import { DailyState } from '@btree/shared';
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  befriend,
  closeDb,
  getPrisma,
  hasDb,
  makeApp,
  removeStudents,
  student,
  type Db,
  type Student,
} from './helpers';

describe('daily helpers', () => {
  it('gives everyone the same eight distinct keys for a day', async () => {
    const { dailyKeys } = await import('../src/lib/daily');
    const keys = dailyKeys('2026-11-15');
    expect(keys).toEqual(dailyKeys('2026-11-15'));
    expect(new Set(keys).size).toBe(8);
    expect(dailyKeys('2026-11-16')).not.toEqual(keys);
  });

  it('resets at midnight in Johannesburg', async () => {
    const { nextDayStart } = await import('../src/lib/daily');
    expect(nextDayStart('2026-11-15').toISOString()).toBe('2026-11-15T22:00:00.000Z');
  });
});

describe.skipIf(!hasDb)('daily routes (database)', () => {
  let app: Express;
  let prisma: Db;
  const created: string[] = [];

  const fresh = async (name: string) => {
    const s = await student(app, name);
    created.push(s.id);
    return s;
  };

  const play = async (s: Student, wrong = 0, ago = 60_000, hints = 0) => {
    const started = DailyState.parse((await s.agent.post('/api/daily/start').expect(200)).body);
    await prisma.dailyRun.updateMany({
      where: { userId: s.id },
      data: { startedAt: new Date(Date.now() - ago) },
    });
    const plays = dailyMoves(started.keys!).map((m, i) => ({
      tries: i < wrong ? ['wrong', m.answer] : [m.answer],
      hint: i < hints,
    }));
    const res = await s.agent
      .post('/api/daily/finish')
      .send({ day: started.day, plays })
      .expect(200);
    return DailyState.parse(res.body);
  };

  beforeAll(async () => {
    app = await makeApp();
    prisma = await getPrisma();
  });

  afterAll(async () => {
    await removeStudents(created);
    await closeDb();
  });

  it('needs a session', async () => {
    await request(app).get('/api/daily').expect(401);
  });

  it('hides the keys until the student starts', async () => {
    const s = await fresh('Peeker');
    const body = DailyState.parse((await s.agent.get('/api/daily').expect(200)).body);
    expect(body.keys).toBeNull();
    expect(body.startedAt).toBeNull();
    expect(body.leaderboard).toBeNull();
  });

  it('keeps the first start time when start is called again', async () => {
    const s = await fresh('Restarter');
    const first = DailyState.parse((await s.agent.post('/api/daily/start').expect(200)).body);
    const again = DailyState.parse((await s.agent.post('/api/daily/start').expect(200)).body);
    expect(again.startedAt).toBe(first.startedAt);
    expect(again.keys).toEqual(first.keys);
  });

  it('scores on the server and only allows one finish a day', async () => {
    const s = await fresh('Once');
    const done = await play(s);
    expect(done.result).toMatchObject({ mistakes: 0, hints: 0, penaltyMs: 0 });
    expect(done.result!.timeMs).toBeGreaterThanOrEqual(60_000);
    expect(done.result!.score).toBe(1000 - Math.round(done.result!.timeMs / 500));

    await s.agent.post('/api/daily/finish').send({ day: done.day, plays: [] }).expect(409);
    const restart = DailyState.parse((await s.agent.post('/api/daily/start').expect(200)).body);
    expect(restart.result).toEqual(done.result);
  });

  it('adds 10 seconds per wrong tap and 30 per hint', async () => {
    const s = await fresh('Penalised');
    const done = await play(s, 2, 60_000, 1);
    expect(done.result).toMatchObject({ mistakes: 2, hints: 1, penaltyMs: 50_000 });
    expect(done.result!.finalMs).toBe(done.result!.timeMs + 50_000);
    expect(done.leaderboard![0]!.finalMs).toBe(done.result!.finalMs);
  });

  it('rejects a run with an unsolved move', async () => {
    const s = await fresh('Quitter');
    const started = DailyState.parse((await s.agent.post('/api/daily/start').expect(200)).body);
    const plays = dailyMoves(started.keys!).map((m, i) => ({
      tries: i === 0 ? ['wrong'] : [m.answer],
      hint: false,
    }));
    await s.agent.post('/api/daily/finish').send({ day: started.day, plays }).expect(400);
    await s.agent.post('/api/daily/finish').send({ day: started.day, plays: [] }).expect(400);
  });

  it('refuses to finish a run that was never started', async () => {
    const s = await fresh('NoStart');
    await s.agent.post('/api/daily/finish').send({ day: '2026-01-01', plays: [] }).expect(404);
  });

  it('ranks only you and your friends, best score first', async () => {
    const me = await fresh('Me');
    const fast = await fresh('Fast friend');
    const slow = await fresh('Slow friend');
    const stranger = await fresh('Stranger');
    await befriend(me, fast);
    await befriend(slow, me);

    await play(fast, 0, 30_000);
    await play(slow, 2, 200_000);
    await play(stranger, 0, 10_000);
    const mine = await play(me, 0, 90_000);

    expect(mine.leaderboard!.map((e) => e.displayName)).toEqual([
      'Fast friend',
      'Me',
      'Slow friend',
    ]);
    expect(mine.leaderboard!.map((e) => e.rank)).toEqual([1, 2, 3]);
    expect(mine.leaderboard!.find((e) => e.isMe)?.userId).toBe(me.id);
  });

  it('shows no leaderboard before you finish', async () => {
    const a = await fresh('Waiting');
    const b = await fresh('Done');
    await befriend(a, b);
    await play(b);
    const body = DailyState.parse((await a.agent.post('/api/daily/start').expect(200)).body);
    expect(body.leaderboard).toBeNull();
  });
});
