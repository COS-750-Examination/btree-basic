import { ApiRequestError } from '../api/client';

export function accountErrorText(e: unknown): string {
  if (e instanceof ApiRequestError) {
    const issue = Array.isArray(e.details)
      ? (e.details as { message?: unknown }[]).find((i) => typeof i.message === 'string')
      : undefined;
    if (issue) return issue.message as string;
    if (e.status === 400 || e.status === 429) return e.message;
  }
  return "That didn't save. Check your connection and try again.";
}
