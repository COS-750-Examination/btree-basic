import type { FriendsList } from '@btree/shared';
import { ApiRequestError } from '../api/client';

export const friendErrorText = (e: unknown) =>
  e instanceof ApiRequestError && e.status === 429
    ? e.message
    : "That didn't work. Check your connection and try again.";

export const isNotFriends = (e: unknown) => e instanceof ApiRequestError && e.status === 404;

const sentFmt = new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short' });

export const sentDate = (iso: string) => sentFmt.format(new Date(iso));

export const newRequests = (list: FriendsList | undefined) =>
  list ? list.incoming.filter((r) => r.sentAt > (list.requestsSeenAt ?? '')) : [];
