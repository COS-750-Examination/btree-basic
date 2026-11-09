import request from 'supertest';
import { describe, expect, it } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ??= 'test-secret-that-is-at-least-32-characters-long';
process.env.DATABASE_URL ??= 'postgresql://btree:btree@localhost:5432/btree';

const { createApp } = await import('../src/app');
const app = createApp();

/** Tests that need no database. */
describe('API basics', () => {
  it('GET /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('rejects an invalid register body with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'nope', password: '1' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid request body');
  });

  it('reports a guest session as user: null', async () => {
    const res = await request(app).get('/api/auth/session');
    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });

  it('requires a session for progress', async () => {
    const res = await request(app).get('/api/progress');
    expect(res.status).toBe(401);
  });

  it('returns JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
  });
});
