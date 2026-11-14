import { InviteCode, InvitePreview, InviteResult } from '@btree/shared';
import type { Express } from 'express';
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

describe.skipIf(!hasDb)('invite links (database)', () => {
  let app: Express;
  let prisma: Db;
  const created: string[] = [];

  const fresh = async (name: string) => {
    const s = await student(app, name);
    created.push(s.id);
    return s;
  };
  const codeOf = async (s: Student) =>
    InviteCode.parse((await s.agent.get('/api/invites/mine').expect(200)).body).code;

  beforeAll(async () => {
    app = await makeApp();
    prisma = await getPrisma();
  });

  afterAll(async () => {
    await removeStudents(created);
    await closeDb();
  });

  it('gives each student one stable code and replaces it on reset', async () => {
    const a = await fresh('Sharer');
    const code = await codeOf(a);
    expect(code).toMatch(/^[A-Z2-9]{8}$/);
    expect(await codeOf(a)).toBe(code);

    const { code: next } = InviteCode.parse(
      (await a.agent.post('/api/invites/mine/reset').expect(200)).body,
    );
    expect(next).not.toBe(code);

    const b = await fresh('Late');
    await b.agent.get(`/api/invites/${code}`).expect(404);
    await b.agent.get(`/api/invites/${next}`).expect(200);
  });

  it('previews the owner by name only and follows the request through', async () => {
    const a = await fresh('Owner');
    const b = await fresh('Visitor');
    const code = await codeOf(a);

    const preview = (await b.agent.get(`/api/invites/${code.toLowerCase()}`).expect(200)).body;
    expect(preview).toEqual({ displayName: 'Owner', status: 'none', friendId: null });
    expect(JSON.stringify(preview)).not.toContain('@');

    const sent = InviteResult.parse((await b.agent.post(`/api/invites/${code}`).expect(201)).body);
    expect(sent.status).toBe('sent');
    expect(
      InvitePreview.parse((await b.agent.get(`/api/invites/${code}`).expect(200)).body).status,
    ).toBe('sent');

    const row = await prisma.friendship.findUniqueOrThrow({
      where: { requesterId_addresseeId: { requesterId: b.id, addresseeId: a.id } },
    });
    expect(row.status).toBe('pending');
  });

  it('makes you friends at once when the owner had already asked you', async () => {
    const a = await fresh('Asker');
    const b = await fresh('Asked');
    await a.agent.post('/api/friends/requests').send({ email: b.email }).expect(202);

    const code = await codeOf(a);
    expect(
      InvitePreview.parse((await b.agent.get(`/api/invites/${code}`).expect(200)).body).status,
    ).toBe('received');
    const res = InviteResult.parse((await b.agent.post(`/api/invites/${code}`).expect(200)).body);
    expect(res).toEqual({ status: 'friends', friendId: a.id });
  });

  it('reports existing friends and refuses your own link', async () => {
    const a = await fresh('Pal');
    const b = await fresh('Buddy');
    await befriend(a, b);
    const code = await codeOf(a);

    expect((await b.agent.get(`/api/invites/${code}`).expect(200)).body).toEqual({
      displayName: 'Pal',
      status: 'friends',
      friendId: a.id,
    });
    expect((await a.agent.get(`/api/invites/${code}`).expect(200)).body.status).toBe('self');
    await a.agent.post(`/api/invites/${code}`).expect(400);
  });

  it('returns 404 for codes that do not exist or are malformed', async () => {
    const s = await fresh('Guesser');
    await s.agent.get('/api/invites/ZZZZZZZZ').expect(404);
    await s.agent.get('/api/invites/not-a-code').expect(404);
    await s.agent.post('/api/invites/ZZZZZZZZ').expect(404);
  });

  it('needs a signed-in student', async () => {
    const { default: request } = await import('supertest');
    await request(app).get('/api/invites/mine').expect(401);
    await request(app).get('/api/invites/ABCDEFGH').expect(401);
  });
});
