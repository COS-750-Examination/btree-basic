import { BADGES, type Badge } from '@btree/shared';

export const LOCKED_BADGES: Badge[] = BADGES.map((b) => ({ ...b, awardedAt: null }));

export const badgeDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
