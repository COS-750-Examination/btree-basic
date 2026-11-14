import { randomUUID } from 'node:crypto';
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  befriend,
  closeDb,
  hasDb,
  makeApp,
  removeStudents,
  student,
  type Agent,
  type Student,
} from './helpers';

const OLD_PASSWORD = 'old-password-1';
const NEW_PASSWORD = 'new-password-2';

describe.skipIf(!hasDb)('PATCH /api/account (database)', () => {
  let app: Express;
  const ids: string[] = [];

  const newStudent = async (name = 'Settings'): Promise<Student> => {
    const s = await student(app, name);
    ids.push(s.id);
    return s;
  };

  const registered = async (displayName = 'Registered') => {
    const email = `test-${randomUUID()}@btree.local`;
    const agent: Agent = request.agent(app);
    const res = await agent
      .post('/api/auth/register')
      .send({ email, password: OLD_PASSWORD, displayName })
      .expect(201);
    ids.push(res.body.id);
    return { agent, email, body: res.body };
  };

  const login = (email: string, password: string) =>
    request(app).post('/api/auth/login').send({ email, password });

  beforeAll(async () => {
    app = await makeApp();
  });

  afterAll(async () => {
    await removeStudents(ids);
    await closeDb();
  });

  describe('display name', () => {
    it('renames the student and returns the updated PublicUser', async () => {
      const s = await newStudent('Old Name');

      const res = await s.agent
        .patch('/api/account')
        .send({ displayName: '  New Name  ' })
        .expect(200);

      expect(res.body).toEqual({
        id: s.id,
        email: s.email,
        displayName: 'New Name',
        theme: null,
        plantedAt: expect.any(String),
      });
    });

    it("shows the new name in a friend's GET /api/friends", async () => {
      const a = await newStudent('Before');
      const b = await newStudent('Watcher');
      await befriend(a, b);

      await a.agent.patch('/api/account').send({ displayName: 'After' }).expect(200);

      const res = await b.agent.get('/api/friends').expect(200);
      expect(res.body.friends.map((f: { displayName: string }) => f.displayName)).toEqual([
        'After',
      ]);
    });
  });

  describe('theme', () => {
    it('gives a new account the theme null', async () => {
      const r = await registered();
      expect(r.body.theme).toBeNull();
      const session = await r.agent.get('/api/auth/session').expect(200);
      expect(session.body.user.theme).toBeNull();
    });

    it('saves the theme and returns it from /api/auth/session', async () => {
      const s = await newStudent();

      const res = await s.agent.patch('/api/account').send({ theme: 'dusk' }).expect(200);
      expect(res.body.theme).toBe('dusk');

      const session = await s.agent.get('/api/auth/session').expect(200);
      expect(session.body.user.theme).toBe('dusk');
    });
  });

  describe('password', () => {
    it('changes the password: the old one stops working and the new one logs in', async () => {
      const r = await registered();

      await r.agent
        .patch('/api/account')
        .send({ currentPassword: OLD_PASSWORD, newPassword: NEW_PASSWORD })
        .expect(200);

      await login(r.email, OLD_PASSWORD).expect(401);
      await login(r.email, NEW_PASSWORD).expect(200);
      await r.agent.get('/api/auth/me').expect(200);
    });

    it("returns 400 'Current password is incorrect' and changes nothing when it is wrong", async () => {
      const r = await registered('Unchanged');

      const res = await r.agent
        .patch('/api/account')
        .send({
          displayName: 'Changed',
          currentPassword: 'wrong-password',
          newPassword: NEW_PASSWORD,
        })
        .expect(400);

      expect(res.body.error).toBe('Current password is incorrect');
      const session = await r.agent.get('/api/auth/session').expect(200);
      expect(session.body.user.displayName).toBe('Unchanged');
      await login(r.email, OLD_PASSWORD).expect(200);
    });

    it('limits password changes per student, but not name or theme changes', async () => {
      const r = await registered();
      const wrong = { currentPassword: 'wrong-password', newPassword: NEW_PASSWORD };
      for (let i = 0; i < 10; i += 1) {
        await r.agent.patch('/api/account').send(wrong).expect(400);
      }
      await r.agent.patch('/api/account').send(wrong).expect(429);

      for (let i = 0; i < 25; i += 1) {
        await r.agent
          .patch('/api/account')
          .send({ theme: i % 2 ? 'day' : 'dusk' })
          .expect(200);
      }
    });
  });

  describe('validation', () => {
    it('returns 400 for an empty body', async () => {
      const s = await newStudent();
      await s.agent.patch('/api/account').send({}).expect(400);
    });

    it('returns 400 for newPassword without currentPassword', async () => {
      const s = await newStudent();
      await s.agent.patch('/api/account').send({ newPassword: NEW_PASSWORD }).expect(400);
    });

    it('returns 400 for a new password shorter than 8 characters', async () => {
      const s = await newStudent();
      await s.agent
        .patch('/api/account')
        .send({ currentPassword: OLD_PASSWORD, newPassword: 'short' })
        .expect(400);
    });

    it('returns 401 for a guest', async () => {
      await request(app).patch('/api/account').send({ theme: 'day' }).expect(401);
    });
  });
});
