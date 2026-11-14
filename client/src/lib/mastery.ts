import { MIN_COUNTED_FOR_MASTERY, READY_THRESHOLD } from '@btree/shared';

/** What a started objective still needs, in words a student can act on. */
export function masteryHint(score: number, counted: number): string {
  const outOf = Math.max(counted, MIN_COUNTED_FOR_MASTERY);
  const right = Math.round(score * outOf);
  const more = MIN_COUNTED_FOR_MASTERY - counted;
  if (more > 0)
    return `${right} of ${counted} right so far. Answer ${more} more ${more === 1 ? 'question' : 'questions'} to finish.`;
  return `${right} of ${counted} right. Mastered at ${READY_THRESHOLD * 100}%.`;
}
