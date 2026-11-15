import { DAILY_BROKEN, DAILY_VALID, dailyMoves, pathRound, validRound } from '@btree/engine';
import { DAILY_ROUNDS, DailyState, dailyScore, dailyTotal } from '@btree/shared';
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
  it('gives everyone the same content for a day, with no number used in two rounds', async () => {
    const { dailyContent } = await import('../src/lib/daily');
    const day = dailyContent('2026-11-15');
    expect(day).toEqual(dailyContent('2026-11-15'));
    expect(day.keys).toHaveLength(8);
    expect(day.pathKeys).toHaveLength(10);
    expect(day.validKeys).toHaveLength(24);
    expect(new Set([...day.keys, ...day.pathKeys, ...day.validKeys]).size).toBe(42);
    expect(dailyContent('2026-11-16')).not.toEqual(day);
    expect(day.seed).toBeGreaterThanOrEqual(0);
    expect(day.seed).toBeLessThan(2 ** 31);
  });

  it('resets at midnight in Johannesburg', async () => {
    const { nextDayStart } = await import('../src/lib/daily');
    expect(nextDayStart('2026-11-15').toISOString()).toBe('2026-11-15T22:00:00.000Z');
  });
});

describe('dailyScore and dailyTotal', () => {
  it('starts at 100 and loses points per second at the given rate, to two decimals', () => {
    expect(dailyScore(0, 0.5)).toBe(100);
    expect(dailyScore(60_000, 0.3)).toBe(82);
    expect(dailyScore(41_900, 0.3)).toBe(87.43);
    expect(dailyScore(1_000_000, 0.3)).toBe(0);
  });

  it('weights time by round so a quick run is about 90 and a slow one about 50 to 60', () => {
    const rate = (key: string) => DAILY_ROUNDS.find((r) => r.key === key)!.pointsPerSecond;
    expect(dailyScore(15_000, rate('path'))).toBe(89.5);
    expect(dailyScore(60_000, rate('path'))).toBe(58);
    expect(dailyScore(20_000, rate('valid'))).toBe(90);
    expect(dailyScore(80_000, rate('valid'))).toBe(60);
    expect(dailyScore(45_000, rate('build'))).toBe(88.75);
    expect(dailyScore(180_000, rate('build'))).toBe(55);
  });

  it('averages the three rounds to two decimals', () => {
    expect(dailyTotal([82, 90, 70])).toBe(80.67);
    expect(dailyTotal([100, 100, 100])).toBe(100);
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

  const startRound = async (s: Student, round: number) =>
    DailyState.parse((await s.agent.post(`/api/daily/rounds/${round}/start`).expect(200)).body);

  const playsFor = (state: DailyState, round: number, wrong: number) => {
    if (round === 1) {
      const { keys, seed } = state.content.path!;
      return pathRound(keys, seed).moves.map((m, i) => ({
        tries: i < wrong ? ['n999', m.answer] : [m.answer],
        hint: false,
      }));
    }
    if (round === 2) {
      const { keySets, seed } = state.content.valid!;
      return validRound(keySets, seed).map((m, i) => ({
        tries: [i < wrong ? (m.answer === DAILY_VALID ? DAILY_BROKEN : DAILY_VALID) : m.answer],
        hint: false,
      }));
    }
    return dailyMoves(state.content.build!.keys).map((m) => ({ tries: [m.answer], hint: false }));
  };

  const playRound = async (s: Student, round: number, wrong = 0, ago = 30_000) => {
    const started = await startRound(s, round);
    const run = await prisma.dailyRun.findFirstOrThrow({ where: { userId: s.id } });
    await prisma.dailyRound.updateMany({
      where: { runId: run.id, round },
      data: { startedAt: new Date(Date.now() - ago) },
    });
    const res = await s.agent
      .post(`/api/daily/rounds/${round}/finish`)
      .send({ day: started.day, plays: playsFor(started, round, wrong) })
      .expect(200);
    return DailyState.parse(res.body);
  };

  const playTrio = async (s: Student, ago = [30_000, 30_000, 30_000]) => {
    await playRound(s, 1, 0, ago[0]);
    await playRound(s, 2, 0, ago[1]);
    return playRound(s, 3, 0, ago[2]);
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

  it('hides every round until it starts', async () => {
    const s = await fresh('Peeker');
    const before = DailyState.parse((await s.agent.get('/api/daily').expect(200)).body);
    expect(before.content).toEqual({ path: null, valid: null, build: null });
    expect(before.rounds.map((r) => r.startedAt)).toEqual([null, null, null]);

    const one = await startRound(s, 1);
    expect(one.content.path!.keys).toHaveLength(10);
    expect(one.content.valid).toBeNull();
    expect(one.content.build).toBeNull();
  });

  it('plays the rounds in order', async () => {
    const s = await fresh('Skipper');
    await s.agent.post('/api/daily/rounds/2/start').expect(409);
    await startRound(s, 1);
    await s.agent.post('/api/daily/rounds/3/start').expect(409);
    await s.agent.post('/api/daily/rounds/2/start').expect(409);
    await s.agent.post('/api/daily/rounds/4/start').expect(404);
  });

  it('keeps the first start time of a round when start is called again', async () => {
    const s = await fresh('Restarter');
    const first = await startRound(s, 1);
    const again = await startRound(s, 1);
    expect(again.rounds[0]!.startedAt).toBe(first.rounds[0]!.startedAt);
    expect(again.content.path).toEqual(first.content.path);
  });

  it('scores each round out of 100 and averages them for the day', async () => {
    const s = await fresh('Trio');
    const afterOne = await playRound(s, 1, 1, 40_000);
    const one = afterOne.rounds[0]!.result!;
    expect(one).toMatchObject({ mistakes: 1, hints: 0, penaltyMs: 10_000 });
    expect(one.score).toBe(dailyScore(one.timeMs + one.penaltyMs, 0.7));
    expect(afterOne.total).toBeNull();
    expect(afterOne.leaderboard).toBeNull();

    const afterTwo = await playRound(s, 2, 2, 20_000);
    expect(afterTwo.rounds[1]!.result).toMatchObject({ mistakes: 2, moves: 4, penaltyMs: 20_000 });

    const done = await playRound(s, 3, 0, 60_000);
    const scores = done.rounds.map((r) => r.result!.score);
    expect(done.total).toBe(dailyTotal(scores));
    expect(done.leaderboard![0]).toMatchObject({
      isMe: true,
      total: done.total,
      path: scores[0],
      valid: scores[1],
      build: scores[2],
    });
  });

  it('only allows one finish per round', async () => {
    const s = await fresh('Once');
    const done = await playRound(s, 1);
    await s.agent.post('/api/daily/rounds/1/finish').send({ day: done.day, plays: [] }).expect(409);
  });

  it('rejects an unsolved path step and a retried valid-or-not answer', async () => {
    const s = await fresh('Quitter');
    const one = await startRound(s, 1);
    const plays = playsFor(one, 1, 0);
    plays[0] = { tries: ['n999'], hint: false };
    await s.agent.post('/api/daily/rounds/1/finish').send({ day: one.day, plays }).expect(400);
    await s.agent
      .post('/api/daily/rounds/1/finish')
      .send({ day: one.day, plays: playsFor(one, 1, 0) })
      .expect(200);

    const two = await startRound(s, 2);
    const retried = playsFor(two, 2, 0).map((p) => ({ ...p, tries: ['x', ...p.tries] }));
    await s.agent
      .post('/api/daily/rounds/2/finish')
      .send({ day: two.day, plays: retried })
      .expect(400);
  });

  it('ignores hints in the path round', async () => {
    const s = await fresh('Hinter');
    const one = await startRound(s, 1);
    const plays = playsFor(one, 1, 0).map((p) => ({ ...p, hint: true }));
    const res = await s.agent
      .post('/api/daily/rounds/1/finish')
      .send({ day: one.day, plays })
      .expect(200);
    expect(DailyState.parse(res.body).rounds[0]!.result!.hints).toBe(0);
  });

  it('ranks only you and your friends by the day total', async () => {
    const me = await fresh('Me');
    const fast = await fresh('Fast friend');
    const slow = await fresh('Slow friend');
    const stranger = await fresh('Stranger');
    await befriend(me, fast);
    await befriend(slow, me);

    await playTrio(fast, [10_000, 10_000, 10_000]);
    await playTrio(slow, [100_000, 100_000, 100_000]);
    await playTrio(stranger, [5_000, 5_000, 5_000]);
    const mine = await playTrio(me, [40_000, 40_000, 40_000]);

    expect(mine.leaderboard!.map((e) => e.displayName)).toEqual([
      'Fast friend',
      'Me',
      'Slow friend',
    ]);
  });

  it('shows no leaderboard before all three rounds are done', async () => {
    const a = await fresh('Waiting');
    const b = await fresh('Done');
    await befriend(a, b);
    await playTrio(b);
    const mid = await playRound(a, 1);
    expect(mid.leaderboard).toBeNull();
  });

  it('includes each round in the data export', async () => {
    const s = await fresh('Exporter');
    await playTrio(s);
    const res = await s.agent.get('/api/account/export').expect(200);
    expect(res.body.dailyRuns[0].rounds).toHaveLength(3);
  });
});
