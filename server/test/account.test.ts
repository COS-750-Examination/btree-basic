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

const SECTIONS = [
  'attempts',
  'badges',
  'cheersReceived',
  'cheersSent',
  'decorations',
  'exportedAt',
  'friendships',
  'hintViews',
  'leaves',
  'lectureQuestions',
  'mastery',
  'modules',
  'user',
  'warmups',
];

describe.skipIf(!hasDb)('GET /api/account/export (database)', () => {
  let app: Express;
  let prisma: Db;
  let me: Student;
  let friend: Student;

  beforeAll(async () => {
    app = await makeApp();
    prisma = await getPrisma();
    me = await student(app, 'Exporter');
    friend = await student(app, 'Export Friend');
    await befriend(me, friend);

    await me.agent
      .put('/api/progress')
      .send({ modules: [{ moduleId: 1, part: 2, completed: true }] })
      .expect(200);
    await me.agent.post('/api/hints').send({ itemId: 'my-item', hint: 1 }).expect(201);
    await me.agent
      .post('/api/attempts')
      .send({ itemId: 'my-item', objective: 'O1', correct: true, firstAttempt: true, hintsUsed: 1 })
      .expect(201);
    await me.agent
      .post('/api/warmup')
      .send({ answers: [{ itemId: 'w1', correct: true }] })
      .expect(201);
    await me.agent.post('/api/lecture-questions').send({ text: 'Why order m?' }).expect(201);
    await me.agent.post(`/api/friends/${friend.id}/cheers`).send({ message: 'Go!' }).expect(201);
    await friend.agent
      .post(`/api/friends/${me.id}/cheers`)
      .send({ message: 'You too!' })
      .expect(201);
    await friend.agent
      .post('/api/attempts')
      .send({
        itemId: 'friend-only-item',
        objective: 'O2',
        correct: false,
        firstAttempt: true,
        hintsUsed: 0,
      })
      .expect(201);
  });

  afterAll(async () => {
    await removeStudents([me.id, friend.id]);
    await closeDb();
  });

  it('returns every section as a JSON file download', async () => {
    const res = await me.agent.get('/api/account/export').expect(200);

    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.headers['content-disposition']).toMatch(
      /^attachment; filename="?btree-basic-data-\d{4}-\d{2}-\d{2}\.json"?$/,
    );
    expect(Object.keys(res.body).sort()).toEqual(SECTIONS);
    expect(res.body.user).toMatchObject({ email: me.email, displayName: 'Exporter' });
    expect(res.body.modules).toEqual([expect.objectContaining({ moduleId: 1, part: 2 })]);
    expect(res.body.attempts).toEqual([
      expect.objectContaining({ itemId: 'my-item', correct: true, hintsUsed: 1 }),
    ]);
    expect(res.body.hintViews).toEqual([expect.objectContaining({ itemId: 'my-item', hint: 1 })]);
    expect(res.body.lectureQuestions).toEqual([expect.objectContaining({ text: 'Why order m?' })]);
    expect(res.body.warmups).toHaveLength(1);
    expect(res.body.leaves.length).toBeGreaterThan(0);
    expect(res.body.badges).toEqual([expect.objectContaining({ badge: 'explorer' })]);
    expect(res.body.friendships).toEqual([
      expect.objectContaining({
        friendName: 'Export Friend',
        status: 'accepted',
        direction: 'sent',
      }),
    ]);
    expect(res.body.cheersSent).toEqual([
      expect.objectContaining({ toName: 'Export Friend', message: 'Go!' }),
    ]);
    expect(res.body.cheersReceived).toEqual([
      expect.objectContaining({ fromName: 'Export Friend', message: 'You too!' }),
    ]);
  });

  it("never contains the password hash, any user id, or another student's email or attempts", async () => {
    const res = await me.agent.get('/api/account/export').expect(200);
    const body = JSON.stringify(res.body);

    expect(body).not.toMatch(/passwordHash|not-a-real-hash/);
    expect(body).not.toContain(me.id);
    expect(body).not.toContain(friend.id);
    expect(body).not.toContain(friend.email);
    expect(body).not.toContain('friend-only-item');
    expect(await prisma.quizAttempt.count({ where: { itemId: 'friend-only-item' } })).toBe(1);
  });

  it('includes the saved theme in the user section', async () => {
    await me.agent.patch('/api/account').send({ theme: 'dusk' }).expect(200);
    const res = await me.agent.get('/api/account/export').expect(200);
    expect(res.body.user.theme).toBe('dusk');
  });

  it('returns 401 for a guest', async () => {
    await request(app).get('/api/account/export').expect(401);
  });
});
