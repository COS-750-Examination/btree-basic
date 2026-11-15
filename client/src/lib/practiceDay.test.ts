import { afterEach, describe, expect, it } from 'vitest';
import { loadDone, nextUnfinished, practiceDay, saveDone } from './practiceDay';

const order = ['a', 'b', 'c', 'd'] as const;

afterEach(() => localStorage.clear());

describe('practiceDay', () => {
  it('uses South African time, so 23:30 UTC is already the next day', () => {
    expect(practiceDay(new Date('2026-11-15T21:59:00Z'))).toBe('2026-11-15');
    expect(practiceDay(new Date('2026-11-15T22:30:00Z'))).toBe('2026-11-16');
  });
});

describe('nextUnfinished', () => {
  it('moves to the next activity in order', () => {
    expect(nextUnfinished(order, ['a'], 'a')).toBe('b');
  });

  it('skips finished ones and wraps round to ones that were skipped', () => {
    expect(nextUnfinished(order, ['b', 'c', 'd'], 'd')).toBe('a');
    expect(nextUnfinished(order, ['a', 'd'], 'a')).toBe('b');
  });

  it('returns null when everything is done', () => {
    expect(nextUnfinished(order, ['a', 'b', 'c', 'd'], 'd')).toBeNull();
  });
});

describe('loadDone and saveDone', () => {
  it('keeps each account and day separate', () => {
    saveDone('me', '2026-11-15', ['a', 'b']);
    expect(loadDone('me', '2026-11-15')).toEqual(['a', 'b']);
    expect(loadDone('me', '2026-11-16')).toEqual([]);
    expect(loadDone('guest', '2026-11-15')).toEqual([]);
  });
});
