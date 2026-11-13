import { randomUUID } from 'node:crypto';
import { DECORATIONS } from '@btree/shared';
import type { Express } from 'express';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ??= 'test-secret-that-is-at-least-32-characters-long';

export const hasDb = Boolean(process.env.DATABASE_URL);

export type Agent = ReturnType<typeof request.agent>;

export interface Student {
  agent: Agent;
  id: string;
  email: string;
  displayName: string;
}

export async function getPrisma() {
  return (await import('../src/lib/prisma')).prisma;
}

export type Db = Awaited<ReturnType<typeof getPrisma>>;

export async function makeApp(): Promise<Express> {
  const { createApp } = await import('../src/app');
  return createApp();
}

export async function student(app: Express, displayName = 'Student'): Promise<Student> {
  const prisma = await getPrisma();
  const { SESSION_COOKIE, signSession } = await import('../src/lib/auth');
  const email = `test-${randomUUID()}@btree.local`;
  const user = await prisma.user.create({
    data: { email, displayName, passwordHash: 'not-a-real-hash' },
  });
  const agent = request.agent(app).set('Cookie', `${SESSION_COOKIE}=${signSession(user.id)}`);
  return { agent, id: user.id, email, displayName };
}

export async function befriend(a: Student, b: Student): Promise<void> {
  await a.agent.post('/api/friends/requests').send({ email: b.email }).expect(202);
  const prisma = await getPrisma();
  const row = await prisma.friendship.findUniqueOrThrow({
    where: { requesterId_addresseeId: { requesterId: a.id, addresseeId: b.id } },
  });
  await b.agent.post(`/api/friends/requests/${row.id}/accept`).expect(204);
}

export async function removeStudents(ids: string[]): Promise<void> {
  const prisma = await getPrisma();
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

export async function ensureCatalogue(): Promise<void> {
  const prisma = await getPrisma();
  for (const { id, name, cost } of DECORATIONS) {
    const row = { id, name, cost };
    await prisma.decoration.upsert({ where: { id }, create: row, update: row });
  }
}

export async function giveLeaves(userId: string, amount: number): Promise<void> {
  const prisma = await getPrisma();
  await prisma.leafTransaction.create({ data: { userId, amount, reason: 'lesson' } });
}

export async function completeModules(userId: string, n: number): Promise<void> {
  const prisma = await getPrisma();
  for (let moduleId = 1; moduleId <= n; moduleId += 1) {
    await prisma.moduleProgress.upsert({
      where: { userId_moduleId: { userId, moduleId } },
      create: { userId, moduleId, completedAt: new Date() },
      update: { completedAt: new Date() },
    });
  }
}

export async function closeDb(): Promise<void> {
  await (await getPrisma()).$disconnect();
}
