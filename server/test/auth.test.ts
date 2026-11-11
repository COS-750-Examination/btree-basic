import { DECORATIONS } from '@btree/shared';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ??= 'test-secret-that-is-at-least-32-characters-long';

const hasDb = Boolean(process.env.DATABASE_URL);

/** Needs PostgreSQL with migrations applied (`npm run db:up && npm run db:migrate`). */
describe.skipIf(!hasDb)('auth and progress (database)', async () => {
  const { createApp } = await import('../src/app');
  const { prisma } = await import('../src/lib/prisma');
  const agent = request.agent(createApp());
  const email = `test-${Date.now()}@btree.local`;

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  it('registers and sets an httpOnly cookie', async () => {
    const res = await agent
      .post('/api/auth/register')
      .send({ email, password: 'correct-horse', displayName: 'Tester' });
    expect(res.status).toBe(201);
    expect(String(res.headers['set-cookie'])).toMatch(/HttpOnly/i);
  });

  it('returns the current user', async () => {
    const res = await agent.get('/api/auth/me');
    expect(res.body.email).toBe(email);
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('saves progress and awards lesson leaves once', async () => {
    const body = { modules: [{ moduleId: 1, part: 1, completed: true }] };
    await agent.put('/api/progress').send(body).expect(200);
    const res = await agent.put('/api/progress').send(body).expect(200);
    expect(res.body.modulesDone).toBe(1);
    expect(res.body.leaves).toBe(30);
  });

  it('counts only first-try, no-hint attempts toward mastery', async () => {
    await agent
      .post('/api/attempts')
      .send({ itemId: 'q1', objective: 'O5', correct: true, firstAttempt: false, hintsUsed: 1 })
      .expect(201);
    const res = await agent
      .post('/api/attempts')
      .send({ itemId: 'q2', objective: 'O5', correct: true, firstAttempt: true, hintsUsed: 0 })
      .expect(201);
    expect(res.body.counted).toBe(1);
  });

  it('refuses a decoration the tree is too small for', async () => {
    // The catalogue comes from the seed, which CI does not run, so make sure the row exists.
    const swing = DECORATIONS.find((d) => d.id === 'tree-swing')!;
    const row = { id: swing.id, name: swing.name, cost: swing.cost };
    await prisma.decoration.upsert({ where: { id: row.id }, create: row, update: {} });

    const res = await agent.post('/api/decorations/tree-swing/purchase');
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('This unlocks when your tree is a young tree');
  });

  it('rejects a wrong password with a generic message', async () => {
    const res = await request(createApp())
      .post('/api/auth/login')
      .send({ email, password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Email or password is incorrect');
  });

  it('logs out and deletes the account', async () => {
    await agent.delete('/api/account').expect(204);
    await agent.get('/api/auth/me').expect(401);
  });
});
