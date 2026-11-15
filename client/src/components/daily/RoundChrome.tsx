import {
  DAILY_MAX_SCORE,
  DAILY_ROUNDS,
  DAILY_WRONG_PENALTY_MS,
  type DailyState,
} from '@btree/shared';
import { Clock } from 'lucide-react';
import type { ReactNode } from 'react';
import { formatScore, formatTime, useNow } from '../../lib/dailyFormat';
import { Button, LeafIcon, cn } from '../ui';
import type { Message } from './useRoundPlay';

export function RoundStrip({ state, current }: { state: DailyState; current: number | null }) {
  return (
    <ol aria-label="Today's rounds" className="grid grid-cols-3 gap-2">
      {DAILY_ROUNDS.map((r) => {
        const result = state.rounds[r.id - 1]?.result;
        const playing = current === r.id;
        return (
          <li
            key={r.id}
            aria-current={playing ? 'step' : undefined}
            className={cn(
              'shadow-paper-stack-sm flex items-center gap-2 rounded-md px-3 py-2 transition-colors duration-300',
              playing ? 'bg-highlight text-on-highlight' : 'bg-paper',
            )}
          >
            {result ? (
              <LeafIcon className="pop h-6 w-6 shrink-0" />
            ) : (
              <span
                aria-hidden
                className={cn(
                  'rounded-pill h-6 w-6 shrink-0 border-2',
                  playing ? 'border-on-highlight bg-node-fill' : 'border-ink/40',
                )}
              />
            )}
            <span className="min-w-0">
              <span className="text-small block truncate font-bold">
                {r.id} · {r.label}
              </span>
              <span className="text-small block">
                {result
                  ? formatScore(result.score)
                  : playing
                    ? 'Playing now'
                    : `Up to ${DAILY_MAX_SCORE} points`}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function RoundHeader({
  round,
  startedAt,
  penaltyMs,
  total,
}: {
  round: number;
  startedAt: string;
  penaltyMs: number;
  total: number;
}) {
  const now = useNow();
  const elapsed = now - Date.parse(startedAt);
  const label = DAILY_ROUNDS.find((r) => r.id === round)!.label;
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-label font-bold">
        Round {round} · {label}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <p
          className="bg-highlight text-on-highlight rounded-pill text-label flex items-center gap-1.5 px-3 py-1 font-bold"
          aria-label={`Time ${formatTime(elapsed)}`}
        >
          <Clock className="h-4 w-4" aria-hidden />
          {formatTime(elapsed)}
        </p>
        {penaltyMs > 0 && (
          <p
            className="bg-danger text-ink rounded-pill text-label px-3 py-1 font-bold"
            aria-label={`Penalties ${formatTime(penaltyMs)}`}
          >
            +{formatTime(penaltyMs)}
          </p>
        )}
        <p className="bg-paper shadow-paper-stack-sm rounded-pill text-label px-3 py-1 font-bold">
          Day total {formatScore(total)}
        </p>
      </div>
    </div>
  );
}

export function PromptBar({ title, detail }: { title: ReactNode; detail?: ReactNode }) {
  return (
    <div className="mb-3">
      <h2 className="text-heading">{title}</h2>
      {detail && <p className="text-small mt-1">{detail}</p>}
    </div>
  );
}

export function FeedbackBox({
  message,
  idle,
  shake = 0,
}: {
  message: Message | null;
  idle: string;
  shake?: number;
}) {
  const wrong = message?.tone === 'wrong';
  return (
    <div
      key={shake}
      role="status"
      className={cn(
        'text-small mt-5 rounded-lg border-2 border-dashed p-4',
        wrong ? 'border-danger' : message ? 'border-leaf' : 'border-ink/50 text-ink-muted',
        wrong && shake > 0 && 'shake',
        message && !wrong && 'pop',
      )}
    >
      {wrong ? (
        <>
          <strong>Not quite (+{DAILY_WRONG_PENALTY_MS / 1000}s). </strong>
          {message.text}
          {message.retry ? ' Try again.' : ''}
        </>
      ) : message ? (
        <>
          <strong>Correct!</strong>
          {message.text ? ` ${message.text}` : ''}
        </>
      ) : (
        idle
      )}
    </div>
  );
}

export function SubmitState({ failed, onRetry }: { failed: boolean; onRetry: () => void }) {
  return (
    <div className="py-8 text-center">
      {failed ? (
        <>
          <p className="text-danger-text font-bold" role="alert">
            Couldn't save your score.
          </p>
          <Button className="mt-3" onClick={onRetry}>
            Try again
          </Button>
        </>
      ) : (
        <p className="text-ink-muted">Saving your score…</p>
      )}
    </div>
  );
}
