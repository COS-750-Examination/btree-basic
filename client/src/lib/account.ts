import { ApiRequestError } from '../api/client';

/**
 * Text for a failed account change. "Current password is incorrect" (400) and the 429
 * "Slow down" message are shown as the server wrote them; a rejected field shows the first
 * field message; anything else gets a general message.
 */
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
