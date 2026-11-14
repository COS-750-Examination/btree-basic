import { describe, expect, it } from 'vitest';
import { ApiRequestError } from '../api/client';
import { accountErrorText } from './account';

describe('accountErrorText', () => {
  it('shows server messages for a wrong password and too many tries', () => {
    expect(accountErrorText(new ApiRequestError(400, 'Current password is incorrect'))).toBe(
      'Current password is incorrect',
    );
    expect(
      accountErrorText(new ApiRequestError(429, 'Slow down a little and try again later')),
    ).toBe('Slow down a little and try again later');
  });

  it('shows the first field message from a rejected body', () => {
    const e = new ApiRequestError(400, 'Invalid request body', [
      { path: ['newPassword'], message: 'Use at least 8 characters' },
    ]);
    expect(accountErrorText(e)).toBe('Use at least 8 characters');
  });

  it('falls back to a general message', () => {
    expect(accountErrorText(new TypeError('Failed to fetch'))).toMatch(/didn't save/);
    expect(accountErrorText(new ApiRequestError(500, 'Internal'))).toMatch(/didn't save/);
  });
});
