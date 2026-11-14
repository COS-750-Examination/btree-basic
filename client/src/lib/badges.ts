import { BADGES, type Badge } from '@btree/shared';

/** What a guest sees: all four badges, locked. */
export const LOCKED_BADGES: Badge[] = BADGES.map((b) => ({ ...b, awardedAt: null }));

/** "14 Nov 2026", the date a badge was earned. */
export const badgeDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
