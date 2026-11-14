import { ApiRequestError } from '../api/client';

/**
 * Text for a failed friend action. The server's 429 message ("Slow down a little and try
 * again later") is shown as it is; anything else gets a general message.
 */
export const friendErrorText = (e: unknown) =>
  e instanceof ApiRequestError && e.status === 429
    ? e.message
    : "That didn't work. Check your connection and try again.";

/** Their grove is 404 once you are no longer friends (or never were). */
export const isNotFriends = (e: unknown) => e instanceof ApiRequestError && e.status === 404;

const sentFmt = new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short' });

/** "14 Nov", when a request was sent. */
export const sentDate = (iso: string) => sentFmt.format(new Date(iso));
