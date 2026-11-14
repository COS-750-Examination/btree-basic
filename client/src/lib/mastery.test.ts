import { objectiveMastery, type AttemptLike } from '@btree/shared';
import { describe, expect, it } from 'vitest';
import { masteryHint } from './mastery';

const answers = (...results: boolean[]): AttemptLike[] =>
  results.map((correct) => ({ objective: 'O5', correct, firstAttempt: true, hintsUsed: 0 }));
const o5 = (...results: boolean[]) =>
  objectiveMastery(answers(...results)).find((o) => o.objective === 'O5')!;

describe('mastery percentage', () => {
  it('needs three answers before it can reach 100%', () => {
    expect(o5(true).score).toBeCloseTo(1 / 3);
    expect(o5(true, true).score).toBeCloseTo(2 / 3);
    expect(o5(true, true, true)).toMatchObject({ score: 1, status: 'mastered' });
  });

  it('is the share right once there are enough answers', () => {
    expect(o5(true, true, true, true, false)).toMatchObject({ score: 0.8, status: 'mastered' });
    expect(o5(true, false, true)).toMatchObject({ status: 'getting-there' });
    expect(o5(true, false, true).score).toBeCloseTo(2 / 3);
  });

  it('never shows 80% or more while still getting there', () => {
    for (let n = 1; n <= 6; n++)
      for (let right = 0; right <= n; right++) {
        const m = o5(...Array.from({ length: n }, (_, i) => i < right));
        expect(m.score >= 0.8).toBe(m.status === 'mastered');
      }
  });

  it('ignores answers given after a hint or a wrong try', () => {
    const m = objectiveMastery([
      { objective: 'O5', correct: true, firstAttempt: false, hintsUsed: 0 },
      { objective: 'O5', correct: true, firstAttempt: true, hintsUsed: 1 },
    ]).find((o) => o.objective === 'O5')!;
    expect(m).toMatchObject({ score: 0, counted: 0, status: 'not-started' });
  });
});

describe('masteryHint', () => {
  it('says how many more answers are needed', () => {
    expect(masteryHint(1 / 3, 1)).toBe('1 of 1 right so far. Answer 2 more questions to finish.');
    expect(masteryHint(1 / 3, 2)).toBe('1 of 2 right so far. Answer 1 more question to finish.');
  });

  it('gives the target once there are enough answers', () => {
    expect(masteryHint(2 / 3, 3)).toBe('2 of 3 right. Mastered at 80%.');
  });
});
