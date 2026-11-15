import type { DailyEntry, DailyState } from '@btree/shared';
import { describe, expect, it } from 'vitest';
import { dayTotalSoFar, formatScore, formatTime, rankBy } from './dailyFormat';

const e = (name: string, total: number, path: number): DailyEntry => ({
  userId: name,
  displayName: name,
  total,
  path,
  valid: 0,
  build: 0,
  isMe: false,
});

describe('rankBy', () => {
  it('sorts by the chosen round and breaks ties by total', () => {
    const list = [e('a', 50, 80), e('b', 70, 80), e('c', 90, 60)];
    expect(rankBy(list, 'path').map((x) => x.displayName)).toEqual(['b', 'a', 'c']);
    expect(rankBy(list, 'total').map((x) => x.displayName)).toEqual(['c', 'b', 'a']);
  });
});

describe('dayTotalSoFar', () => {
  it('adds finished rounds and divides by three, so it builds up to the final average', () => {
    const result = (score: number) => ({
      score,
      timeMs: 0,
      penaltyMs: 0,
      finalMs: 0,
      mistakes: 0,
      hints: 0,
      moves: 1,
    });
    const state = {
      rounds: [
        { round: 1, startedAt: null, result: result(90) },
        { round: 2, startedAt: null, result: result(80) },
        { round: 3, startedAt: null, result: null },
      ],
    } as DailyState;
    expect(dayTotalSoFar(state)).toBe(56.67);
  });
});

describe('formatting', () => {
  it('shows two decimals and m:ss', () => {
    expect(formatScore(87.4)).toBe('87.40');
    expect(formatTime(65_900)).toBe('1:05');
  });
});
