import { describe, expect, it } from 'vitest';
import { ApiRequestError } from '../api/client';
import { friendErrorText, isNotFriends, newRequests } from './friends';

describe('friend helpers', () => {
  it('passes the 429 message through and hides other errors', () => {
    expect(
      friendErrorText(new ApiRequestError(429, 'Slow down a little and try again later')),
    ).toBe('Slow down a little and try again later');
    expect(friendErrorText(new ApiRequestError(500, 'Internal error'))).toMatch(/didn't work/);
    expect(friendErrorText(new TypeError('Failed to fetch'))).toMatch(/didn't work/);
  });

  it('treats a 404 grove as no longer friends', () => {
    expect(isNotFriends(new ApiRequestError(404, 'Not found'))).toBe(true);
    expect(isNotFriends(new ApiRequestError(500, 'oops'))).toBe(false);
    expect(isNotFriends(null)).toBe(false);
  });
});

describe('newRequests', () => {
  const list = (requestsSeenAt: string | null) => ({
    friends: [],
    outgoing: [],
    incoming: [
      { id: 'old', fromName: 'Old', sentAt: '2026-11-14T08:00:00.000Z' },
      { id: 'new', fromName: 'New', sentAt: '2026-11-15T08:00:00.000Z' },
    ],
    requestsSeenAt,
  });

  it('counts every request until the Account page has been opened', () => {
    expect(newRequests(list(null)).map((r) => r.id)).toEqual(['old', 'new']);
  });

  it('only counts requests that arrived after the last visit, even if older ones were ignored', () => {
    expect(newRequests(list('2026-11-14T08:00:00.000Z')).map((r) => r.id)).toEqual(['new']);
    expect(newRequests(list('2026-11-15T08:00:00.000Z'))).toEqual([]);
    expect(newRequests(undefined)).toEqual([]);
  });
});
