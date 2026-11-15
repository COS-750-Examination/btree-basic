import { DAILY_BROKEN, DAILY_VALID, DAILY_VALID_TREES, validRound } from '@btree/engine';
import type { DailyState } from '@btree/shared';
import { useMemo, useRef, useState } from 'react';
import { BTreeView } from '../tree/BTreeView';
import { Button, Card, cn } from '../ui';
import { FeedbackBox, PromptBar, RoundHeader, RoundStrip, SubmitState } from './RoundChrome';
import { dayTotalSoFar } from '../../lib/dailyFormat';
import { buzz, useRoundPlay, useRoundSubmit } from './useRoundPlay';

const RIGHT_PAUSE_MS = 800;

export function ValidRound({ state }: { state: DailyState }) {
  const { keySets, seed } = state.content.valid!;
  const items = useMemo(() => validRound(keySets, seed), [keySets, seed]);
  const round = useRoundPlay(state.day, 2, items, false);
  const [view, setView] = useState(() => round.plays.length);
  const timer = useRef<number | null>(null);
  const ready = view >= items.length;
  const { submit, failed } = useRoundSubmit(
    state.day,
    2,
    round.plays,
    ready,
    `daily-${state.day}-valid`,
  );

  const item = items[Math.min(view, items.length - 1)]!;
  const answered = round.plays.length > view;
  const choice = answered ? round.plays[view]!.tries[0] : null;
  const wasRight = choice === item.answer;

  const next = () => {
    if (timer.current) window.clearTimeout(timer.current);
    round.setMessage(null);
    setView((v) => v + 1);
  };

  const answer = (value: typeof DAILY_VALID | typeof DAILY_BROKEN) => {
    if (answered || ready) return;
    const outcome = round.attempt(value);
    if (outcome === 'right') {
      round.setMessage({ tone: 'right', text: item.reason });
      timer.current = window.setTimeout(next, RIGHT_PAUSE_MS);
    } else if (outcome === 'wrong') {
      buzz();
      round.setMessage({ tone: 'wrong', text: item.reason });
    }
  };

  return (
    <>
      <RoundStrip state={state} current={2} />
      <Card className="mt-4">
        <RoundHeader
          round={2}
          startedAt={state.rounds[1]!.startedAt!}
          penaltyMs={round.penaltyMs}
          total={dayTotalSoFar(state)}
        />
        {ready ? (
          <SubmitState failed={failed} onRetry={submit} />
        ) : (
          <>
            <PromptBar
              title="Is this a valid B-tree?"
              detail={`Tree ${view + 1} of ${DAILY_VALID_TREES} · order 3`}
            />
            <div className="rounded-lg bg-sky-200">
              <BTreeView
                key={view}
                tree={item.tree}
                scene
                className="block"
                label={`Tree ${view + 1}. Is it a valid order-3 B-tree?`}
                overflowNodeId={answered && item.problemNodeId ? item.problemNodeId : undefined}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-3" role="group" aria-label="Your answer">
              <Button
                size="lg"
                className="min-h-11 flex-1"
                disabled={answered}
                aria-pressed={choice === DAILY_VALID}
                onClick={() => answer(DAILY_VALID)}
              >
                Valid B-tree
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className={cn(
                  'text-danger-text shadow-press-coral font-display text-button min-h-11 flex-1',
                )}
                disabled={answered}
                aria-pressed={choice === DAILY_BROKEN}
                onClick={() => answer(DAILY_BROKEN)}
              >
                Something's broken
              </Button>
            </div>
            {answered && !wasRight && (
              <Button className="mt-4" onClick={next}>
                {view + 1 >= items.length ? 'Finish round' : 'Next tree'}
              </Button>
            )}
          </>
        )}
        <FeedbackBox
          message={round.message}
          shake={round.shakes}
          idle="Check every node, then choose. A wrong answer adds 10s."
        />
      </Card>
    </>
  );
}
