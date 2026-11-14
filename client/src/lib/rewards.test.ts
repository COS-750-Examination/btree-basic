import type { ObjectiveId } from '@btree/shared';
import { describe, expect, it } from 'vitest';
import type { LocalAttempt } from '../stores/progressStore';
import { splitRun, streakMessage } from './rewards';

const answer = (objective: ObjectiveId, correct: boolean): LocalAttempt => ({
  itemId: 'x',
  objective,
  correct,
  firstAttempt: true,
  hintsUsed: 0,
  at: 0,
});

describe('streakMessage', () => {
  it('invites a student with no streak to start one', () => {
    expect(streakMessage(0)).toMatch(/answer a question today/i);
  });

  it('counts down to the 3-day bonus', () => {
    expect(streakMessage(1)).toBe('Practise 2 days more in a row for +15 leaves.');
    expect(streakMessage(2)).toBe('Practise 1 day more in a row for +15 leaves.');
  });

  it('confirms the bonus once the streak reaches 3 days', () => {
    expect(streakMessage(3)).toMatch(/\+15 leaves earned/);
    expect(streakMessage(8)).toMatch(/\+15 leaves earned/);
  });
});

describe('splitRun', () => {
  it('counts correct split answers in a row, newest first', () => {
    expect(splitRun([answer('O5', false), answer('O5', true), answer('O5', true)])).toBe(2);
  });

  it('is broken by a wrong split answer', () => {
    expect(splitRun([answer('O5', true), answer('O5', true), answer('O5', false)])).toBe(0);
  });

  it('ignores answers on other objectives', () => {
    expect(splitRun([answer('O5', true), answer('O3', false), answer('O5', true)])).toBe(2);
  });

  it('is zero with no split answers', () => {
    expect(splitRun([answer('O3', true)])).toBe(0);
  });
});
