import type { z } from 'zod';

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

/**
 * Typed fetch for the Express API. Cookies carry the session (httpOnly), so `credentials`
 * is always included. Responses are parsed with the shared Zod schema when one is given.
 */
async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  schema?: z.ZodType<T>,
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return undefined as T;
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (data ?? {}) as { error?: string; details?: unknown };
    throw new ApiRequestError(res.status, err.error ?? res.statusText, err.details);
  }
  return schema ? schema.parse(data) : (data as T);
}

export const api = {
  get: <T>(path: string, schema?: z.ZodType<T>) => request<T>('GET', path, undefined, schema),
  post: <T>(path: string, body?: unknown, schema?: z.ZodType<T>) =>
    request<T>('POST', path, body ?? {}, schema),
  put: <T>(path: string, body: unknown, schema?: z.ZodType<T>) =>
    request<T>('PUT', path, body, schema),
  patch: <T>(path: string, body: unknown, schema?: z.ZodType<T>) =>
    request<T>('PATCH', path, body, schema),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
