import { LEAF_REWARDS, STREAK_BONUS_DAYS } from '@btree/shared';
import { Flame } from 'lucide-react';
import { Link } from 'react-router';
import { useStreak } from '../../api/hooks';
import { streakMessage } from '../../lib/rewards';
import { Card } from '../ui';

export function StreakCard({ signedIn }: { signedIn: boolean }) {
  const streak = useStreak(signedIn);
  const n = streak.data?.days ?? 0;

  return (
    <Card className="flex gap-3">
      <Flame className="text-danger h-7 w-7 shrink-0" aria-hidden />
      <div>
        {!signedIn ? (
          <>
            <p className="font-bold">Day streak</p>
            <p className="text-small">
              <Link to="/login" className="font-bold underline">
                Sign in
              </Link>{' '}
              to keep a streak. Practise {STREAK_BONUS_DAYS} days in a row for +
              {LEAF_REWARDS.streak} leaves.
            </p>
          </>
        ) : streak.isPending ? (
          <p className="text-small">Checking your streak…</p>
        ) : streak.isError ? (
          <p className="text-small">Your streak couldn&apos;t load. Try again later.</p>
        ) : (
          <>
            <p className="font-bold">
              <span className="font-display text-heading">{n}</span>-day streak
            </p>
            <p className="text-small">{streakMessage(n)}</p>
          </>
        )}
      </div>
    </Card>
  );
}
