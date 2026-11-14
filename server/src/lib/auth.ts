import type { PublicUser } from '@btree/shared';
import bcrypt from 'bcryptjs';
import type { CookieOptions } from 'express';
import jwt from 'jsonwebtoken';
import { env, isProd } from '../env';
import type { User } from '../generated/prisma/client';

export const SESSION_COOKIE = 'btree_session';
const SESSION_DAYS = 14;
const BCRYPT_ROUNDS = 12;

export const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, BCRYPT_ROUNDS);
export const verifyPassword = (password: string, hash: string): Promise<boolean> =>
  bcrypt.compare(password, hash);

export function signSession(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: `${SESSION_DAYS}d` });
}

export function verifySession(token: string): string | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    return typeof payload === 'object' && typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

export const sessionCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: isProd,
  path: '/',
  maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
};

export const toPublicUser = (u: User): PublicUser => ({
  id: u.id,
  email: u.email,
  displayName: u.displayName,
  theme: u.theme,
  plantedAt: u.plantedAt.toISOString(),
});
