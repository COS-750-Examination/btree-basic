import type { Badge, BadgeId } from '@btree/shared';
import { Compass, GraduationCap, Lock, Scissors, Sprout, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { useBadges } from '../../api/hooks';
import { LOCKED_BADGES, badgeDate } from '../../lib/badges';
import { Card, CardTitle, cn } from '../ui';

const ICONS: Record<BadgeId, LucideIcon> = {
  explorer: Compass,
  splitter: Scissors,
  rootRaiser: Sprout,
  lectureReady: GraduationCap,
};

interface Props {
  signedIn: boolean;
  /** One column for a sidebar (Grove); two columns on wider screens otherwise (Ready). */
  compact?: boolean;
}

/** The four badges. Earned ones show the date; locked ones say how to earn them. */
export function BadgeCard({ signedIn, compact = false }: Props) {
  const query = useBadges(signedIn);
  const badges = signedIn ? (query.data ?? LOCKED_BADGES) : LOCKED_BADGES;
  const earned = badges.filter((b) => b.awardedAt).length;

  return (
    <Card>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <CardTitle className="mb-0">Badges</CardTitle>
        {signedIn && query.isSuccess && (
          <span className="text-small font-bold">
            {earned} of {badges.length} earned
          </span>
        )}
      </div>
      {!signedIn && (
        <p className="text-small mb-3">
          <Link to="/login" className="font-bold underline">
            Sign in
          </Link>{' '}
          to earn badges.
        </p>
      )}
      {signedIn && query.isError && (
        <p className="text-small mb-3">Your badges couldn&apos;t load. Try again later.</p>
      )}
      <ul className={cn('grid gap-3', !compact && 'sm:grid-cols-2')}>
        {badges.map((b) => (
          <BadgeTile key={b.id} badge={b} />
        ))}
      </ul>
    </Card>
  );
}

function BadgeTile({ badge }: { badge: Badge }) {
  const Icon = ICONS[badge.id];
  const earned = Boolean(badge.awardedAt);
  return (
    <li
      className={cn(
        'flex items-start gap-3 rounded-lg p-3',
        earned
          ? 'bg-paper shadow-paper-stack-sm'
          : 'border-ink-muted text-ink-muted border-2 border-dashed',
      )}
    >
      <Icon className={cn('mt-0.5 h-6 w-6 shrink-0', earned && 'text-leaf')} aria-hidden />
      <div className="min-w-0">
        <p className="text-label font-bold">{badge.label}</p>
        <p className="text-small">{badge.description}</p>
        <p className="text-small mt-1 flex items-center gap-1 font-bold">
          {earned ? (
            `Earned ${badgeDate(badge.awardedAt!)}`
          ) : (
            <>
              <Lock className="h-3.5 w-3.5" aria-hidden />
              Locked
            </>
          )}
        </p>
      </div>
    </li>
  );
}
