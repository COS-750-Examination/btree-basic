import { describe, expect, it } from 'vitest';
import { ApiRequestError } from '../api/client';
import { friendErrorText, isNotFriends } from './friends';

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
