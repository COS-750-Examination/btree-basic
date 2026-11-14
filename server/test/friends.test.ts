import { randomUUID } from 'node:crypto';
import { FriendGrove, FriendSummary } from '@btree/shared';
import type { Express } from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  befriend,
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
  type Student,
} from './helpers';

const PRIVATE_WORDS = /score|mastery|correct|hint|leaves|answer|email/i;

describe.skipIf(!hasDb)('friends routes (database)', () => {
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

  describe('POST /api/friends/requests', () => {
    it('returns 202 and creates no row for an unknown email', async () => {
      const s = await fresh('Lonely');

      const res = await s.agent
        .post('/api/friends/requests')
        .send({ email: `nobody-${randomUUID()}@btree.local` })
        .expect(202);

      expect(res.body).toEqual({ ok: true });
      expect(await prisma.friendship.count({ where: { requesterId: s.id } })).toBe(0);
    });

    it('returns 202 and creates no row for your own email', async () => {
      const s = await fresh('Self');

      await s.agent.post('/api/friends/requests').send({ email: s.email }).expect(202);

      expect(await prisma.friendship.count({ where: { requesterId: s.id } })).toBe(0);
    });

    it('only lets the addressee accept a request', async () => {
      const a = await fresh('Requester');
      const b = await fresh('Addressee');
      await a.agent.post('/api/friends/requests').send({ email: b.email }).expect(202);
      const row = await prisma.friendship.findUniqueOrThrow({
        where: { requesterId_addresseeId: { requesterId: a.id, addresseeId: b.id } },
      });

      await a.agent.post(`/api/friends/requests/${row.id}/accept`).expect(404);
      expect((await prisma.friendship.findUniqueOrThrow({ where: { id: row.id } })).status).toBe(
        'pending',
      );

      await b.agent.post(`/api/friends/requests/${row.id}/accept`).expect(204);
      const accepted = await prisma.friendship.findUniqueOrThrow({ where: { id: row.id } });
      expect(accepted.status).toBe('accepted');
      expect(accepted.acceptedAt).not.toBeNull();
    });
  });

  describe('GET /api/friends', () => {
    it('lists accepted friends and incoming requests', async () => {
      const a = await fresh('Popular');
      const b = await fresh('Friend');
      const c = await fresh('Hopeful');
      await befriend(a, b);
      await c.agent.post('/api/friends/requests').send({ email: a.email }).expect(202);
      const pending = await prisma.friendship.findUniqueOrThrow({
        where: { requesterId_addresseeId: { requesterId: c.id, addresseeId: a.id } },
      });

      const mine = await a.agent.get('/api/friends').expect(200);

      expect(mine.body.friends).toHaveLength(1);
      expect(mine.body.friends[0]).toMatchObject({ id: b.id, displayName: 'Friend' });
      expect(mine.body.incoming).toEqual([
        { id: pending.id, fromName: 'Hopeful', sentAt: pending.createdAt.toISOString() },
      ]);

      const theirs = await b.agent.get('/api/friends').expect(200);
      expect(theirs.body.friends.map((f: { id: string }) => f.id)).toEqual([a.id]);
      expect(theirs.body.incoming).toEqual([]);
    });
  });

  describe('GET /api/friends/:id/grove', () => {
    it('returns 200 for a friend', async () => {
      const a = await fresh('Visitor');
      const b = await fresh('Host');
      await befriend(a, b);
      await completeModules(b.id, 3);

      const res = await a.agent.get(`/api/friends/${b.id}/grove`).expect(200);

      expect(res.body).toMatchObject({
        id: b.id,
        displayName: 'Host',
        modulesDone: 3,
        completedModules: [1, 2, 3],
        currentModule: 4,
      });
    });

    it('returns 404 for a stranger', async () => {
      const a = await fresh('Nosy');
      const c = await fresh('Private');

      const res = await a.agent.get(`/api/friends/${c.id}/grove`).expect(404);

      expect(res.body.error).toBe('Friend not found');
    });
  });

  describe('requests seen', () => {
    it('starts unseen and remembers the latest seen time on the account', async () => {
      const a = await fresh('Seer');
      expect((await a.agent.get('/api/friends').expect(200)).body.requestsSeenAt).toBeNull();

      const upTo = new Date(Date.now() - 60_000).toISOString();
      await a.agent.post('/api/friends/requests/seen').send({ upTo }).expect(204);
      expect((await a.agent.get('/api/friends').expect(200)).body.requestsSeenAt).toBe(upTo);

      await a.agent
        .post('/api/friends/requests/seen')
        .send({ upTo: new Date(Date.now() - 600_000).toISOString() })
        .expect(204);
      expect((await a.agent.get('/api/friends').expect(200)).body.requestsSeenAt).toBe(upTo);
    });

    it('never moves the seen time into the future', async () => {
      const a = await fresh('Future');
      await a.agent
        .post('/api/friends/requests/seen')
        .send({ upTo: new Date(Date.now() + 86_400_000).toISOString() })
        .expect(204);
      const seen = Date.parse((await a.agent.get('/api/friends').expect(200)).body.requestsSeenAt);
      expect(seen).toBeLessThanOrEqual(Date.now());
    });

    it('rejects a body without a valid time', async () => {
      const a = await fresh('Bad');
      await a.agent.post('/api/friends/requests/seen').send({ upTo: 'yesterday' }).expect(400);
    });
  });

  describe('cheers', () => {
    it('lets a friend cheer (201)', async () => {
      const a = await fresh('Cheerer');
      const b = await fresh('Cheered');
      await befriend(a, b);

      await a.agent
        .post(`/api/friends/${b.id}/cheers`)
        .send({ message: 'Nice split!', moduleId: 6 })
        .expect(201);

      const cheer = await prisma.cheer.findFirstOrThrow({ where: { fromId: a.id, toId: b.id } });
      expect(cheer).toMatchObject({ message: 'Nice split!', moduleId: 6 });
    });

    it('stops a stranger from cheering (403)', async () => {
      const a = await fresh('Target');
      const c = await fresh('Stranger');

      const res = await c.agent.post(`/api/friends/${a.id}/cheers`).send({}).expect(403);

      expect(res.body.error).toBe('You can only cheer friends');
      expect(await prisma.cheer.count({ where: { fromId: c.id } })).toBe(0);
    });

    it('rejects a message over 140 characters with 400', async () => {
      const a = await fresh('Long');
      const b = await fresh('Reader');
      await befriend(a, b);

      const res = await a.agent
        .post(`/api/friends/${b.id}/cheers`)
        .send({ message: 'x'.repeat(141) })
        .expect(400);

      expect(res.body.error).toBe('Invalid request body');
    });

    it('GET /api/cheers returns sent and received cheers, newest first', async () => {
      const a = await fresh('Alpha');
      const b = await fresh('Beta');
      await befriend(a, b);
      await prisma.cheer.createMany({
        data: [
          { fromId: b.id, toId: a.id, message: 'older', createdAt: new Date(Date.now() - 60_000) },
          { fromId: a.id, toId: b.id, message: 'newer', createdAt: new Date() },
        ],
      });

      const res = await a.agent.get('/api/cheers').expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toMatchObject({
        message: 'newer',
        fromId: a.id,
        toId: b.id,
        fromName: 'Alpha',
        toName: 'Beta',
      });
      expect(res.body[1]).toMatchObject({
        message: 'older',
        fromId: b.id,
        toId: a.id,
        fromName: 'Beta',
        toName: 'Alpha',
      });
    });
  });

  describe('privacy', () => {
    const giveScores = async (userId: string) => {
      await prisma.quizAttempt.createMany({
        data: [
          {
            userId,
            itemId: 'secret-item-1',
            objective: 'O5',
            correct: true,
            firstAttempt: true,
            hintsUsed: 0,
            confidence: 'certain',
          },
          {
            userId,
            itemId: 'secret-item-2',
            objective: 'O6',
            correct: false,
            firstAttempt: true,
            hintsUsed: 2,
            misconception: 'promotes-wrong-key',
          },
        ],
      });
      await prisma.mastery.create({ data: { userId, objective: 'O5', score: 1, counted: 1 } });
      await prisma.leafTransaction.create({ data: { userId, amount: 5, reason: 'hintRead' } });
      await giveLeaves(userId, 30);
      await prisma.lectureQuestion.create({ data: { userId, text: 'secret question' } });
      await prisma.userDecoration.create({ data: { userId, decorationId: 'apples' } });
    };

    it('friend grove exposes only FriendGrove fields, never scores, hints or leaves', async () => {
      const a = await fresh('Watcher');
      const b = await fresh('Watched');
      await befriend(a, b);
      await giveScores(b.id);

      const res = await a.agent.get(`/api/friends/${b.id}/grove`).expect(200);

      expect(Object.keys(res.body).sort()).toEqual(Object.keys(FriendGrove.shape).sort());
      const body = JSON.stringify(res.body);
      expect(body).not.toMatch(PRIVATE_WORDS);
      expect(body).not.toContain('secret');
      expect(body).not.toContain(b.email);
      expect(res.body.decorations).toEqual(['apples']);
    });

    it('friend grove never includes badges', async () => {
      const a = await fresh('Onlooker');
      const b = await fresh('Achiever');
      await befriend(a, b);
      await prisma.userBadge.create({ data: { userId: b.id, badge: 'lectureReady' } });

      const res = await a.agent.get(`/api/friends/${b.id}/grove`).expect(200);

      expect(Object.keys(res.body).sort()).toEqual(Object.keys(FriendGrove.shape).sort());
      expect(JSON.stringify(res.body)).not.toMatch(/badge|lectureReady|Lecture Ready/i);
    });

    it('GET /api/friends exposes only FriendSummary fields for each friend', async () => {
      const a = await fresh('Lister');
      const b = await fresh('Listed');
      await befriend(a, b);
      await giveScores(b.id);

      const res = await a.agent.get('/api/friends').expect(200);

      expect(res.body.friends).toHaveLength(1);
      for (const friend of res.body.friends) {
        expect(Object.keys(friend).sort()).toEqual(Object.keys(FriendSummary.shape).sort());
      }
      const body = JSON.stringify(res.body.friends);
      expect(body).not.toMatch(PRIVATE_WORDS);
      expect(body).not.toContain('secret');
      expect(body).not.toContain(b.email);
    });
  });

  describe('request lifecycle (4.1)', () => {
    const ask = (from: Student, to: Student) =>
      from.agent.post('/api/friends/requests').send({ email: to.email }).expect(202);

    const requestRow = (from: Student, to: Student) =>
      prisma.friendship.findUniqueOrThrow({
        where: { requesterId_addresseeId: { requesterId: from.id, addresseeId: to.id } },
      });

    const rowsBetween = (a: Student, b: Student) =>
      prisma.friendship.findMany({
        where: {
          OR: [
            { requesterId: a.id, addresseeId: b.id },
            { requesterId: b.id, addresseeId: a.id },
          ],
        },
      });

    describe('POST /api/friends/requests/:id/decline', () => {
      it('lets the addressee decline a pending request (204) and removes it', async () => {
        const a = await fresh('Asker');
        const b = await fresh('Decliner');
        await ask(a, b);
        const row = await requestRow(a, b);

        await b.agent.post(`/api/friends/requests/${row.id}/decline`).expect(204);

        expect(await rowsBetween(a, b)).toEqual([]);
      });

      it('returns 404 when a stranger tries to decline', async () => {
        const a = await fresh('Asker');
        const b = await fresh('Asked');
        const c = await fresh('Meddler');
        await ask(a, b);
        const row = await requestRow(a, b);

        await c.agent.post(`/api/friends/requests/${row.id}/decline`).expect(404);

        expect(await rowsBetween(a, b)).toHaveLength(1);
      });
    });

    describe('DELETE /api/friends/requests/:id', () => {
      it('lets the requester cancel a pending request (204) and removes it', async () => {
        const a = await fresh('Canceller');
        const b = await fresh('Asked');
        await ask(a, b);
        const row = await requestRow(a, b);

        await a.agent.delete(`/api/friends/requests/${row.id}`).expect(204);

        expect(await rowsBetween(a, b)).toEqual([]);
      });

      it('returns 404 when the addressee tries to cancel', async () => {
        const a = await fresh('Asker');
        const b = await fresh('Asked');
        await ask(a, b);
        const row = await requestRow(a, b);

        await b.agent.delete(`/api/friends/requests/${row.id}`).expect(404);

        expect(await rowsBetween(a, b)).toHaveLength(1);
      });
    });

    describe('DELETE /api/friends/:id', () => {
      it('lets the student who sent the request unfriend (204)', async () => {
        const a = await fresh('Sender');
        const b = await fresh('Accepter');
        await befriend(a, b);

        await a.agent.delete(`/api/friends/${b.id}`).expect(204);

        expect(await rowsBetween(a, b)).toEqual([]);
      });

      it('lets the student who accepted the request unfriend (204)', async () => {
        const a = await fresh('Sender');
        const b = await fresh('Accepter');
        await befriend(a, b);

        await b.agent.delete(`/api/friends/${a.id}`).expect(204);

        expect(await rowsBetween(a, b)).toEqual([]);
      });

      it('returns 404 when the two students are not friends', async () => {
        const a = await fresh('Loner');
        const c = await fresh('Stranger');
        await ask(a, c);

        await a.agent.delete(`/api/friends/${c.id}`).expect(404);

        expect(await rowsBetween(a, c)).toHaveLength(1);
      });

      it('afterwards the grove returns 404 and cheers return 403', async () => {
        const a = await fresh('Former');
        const b = await fresh('Friend');
        await befriend(a, b);
        await a.agent.delete(`/api/friends/${b.id}`).expect(204);

        await a.agent.get(`/api/friends/${b.id}/grove`).expect(404);
        await b.agent.get(`/api/friends/${a.id}/grove`).expect(404);
        await a.agent.post(`/api/friends/${b.id}/cheers`).send({}).expect(403);
      });
    });

    describe('POST /api/friends/requests', () => {
      it('makes A and B friends with one row when their requests cross', async () => {
        const a = await fresh('Crosser A');
        const b = await fresh('Crosser B');

        await ask(a, b);
        await ask(b, a);

        const rows = await rowsBetween(a, b);
        expect(rows).toHaveLength(1);
        expect(rows[0]!.status).toBe('accepted');
        const res = await a.agent.get('/api/friends').expect(200);
        expect(res.body.friends.map((f: { id: string }) => f.id)).toEqual([b.id]);
        expect(res.body.incoming).toEqual([]);
        expect(res.body.outgoing).toEqual([]);
      });

      it('creates no row when the two are already friends', async () => {
        const a = await fresh('Old Friend A');
        const b = await fresh('Old Friend B');
        await befriend(a, b);

        await ask(a, b);
        await ask(b, a);

        const rows = await rowsBetween(a, b);
        expect(rows).toHaveLength(1);
        expect(rows[0]!.status).toBe('accepted');
      });
    });

    describe('GET /api/friends', () => {
      it('lists my pending outgoing requests with the email I typed', async () => {
        const a = await fresh('Outgoing');
        const b = await fresh('Target');
        await ask(a, b);
        const row = await requestRow(a, b);

        const mine = await a.agent.get('/api/friends').expect(200);
        expect(mine.body.outgoing).toEqual([
          { id: row.id, email: b.email, sentAt: row.createdAt.toISOString() },
        ]);

        const theirs = await b.agent.get('/api/friends').expect(200);
        expect(theirs.body.outgoing).toEqual([]);
        expect(theirs.body.incoming).toEqual([
          { id: row.id, fromName: 'Outgoing', sentAt: row.createdAt.toISOString() },
        ]);
      });
    });
  });
});
