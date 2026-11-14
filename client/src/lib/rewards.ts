import { LEAF_REWARDS, STREAK_BONUS_DAYS } from '@btree/shared';
import type { LocalAttempt } from '../stores/progressStore';

const days = (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`;

/** What the streak means right now, and what the next step is. */
export function streakMessage(n: number): string {
  if (n === 0) return 'No streak yet. Answer a question today to start one.';
  if (n < STREAK_BONUS_DAYS)
    return `Practise ${days(STREAK_BONUS_DAYS - n)} more in a row for +${LEAF_REWARDS.streak} leaves.`;
  return `+${LEAF_REWARDS.streak} leaves earned for this streak. Keep it going!`;
}

/**
 * Correct split answers (O5) in a row, counting the most recent first. This is the rule the
 * server uses for the Splitter badge, so quiz answers on O5 count too.
 */
export function splitRun(attempts: readonly LocalAttempt[]): number {
  let run = 0;
  for (let i = attempts.length - 1; i >= 0; i--) {
    const a = attempts[i]!;
    if (a.objective !== 'O5') continue;
    if (!a.correct) break;
    run++;
  }
  return run;
}
