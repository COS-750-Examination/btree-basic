import { DAILY_ORDER, dailyMoves } from '@btree/engine';
import { DAILY_HINT_PENALTY_MS, DAILY_WRONG_PENALTY_MS, type DailyState } from '@btree/shared';
import { Info, Lightbulb } from 'lucide-react';
import { useMemo } from 'react';
import { dailyHint, dailyMistake } from '../../lib/dailyHints';
import { Button, Card } from '../ui';
import { DailyBoard } from './DailyBoard';
import { FeedbackBox, PromptBar, RoundHeader, RoundStrip, SubmitState } from './RoundChrome';
import { dayTotalSoFar } from '../../lib/dailyFormat';
import { useRoundPlay, useRoundSubmit } from './useRoundPlay';

export function BuildRound({ state }: { state: DailyState }) {
  const keys = state.content.build!.keys;
  const moves = useMemo(() => dailyMoves(keys), [keys]);
  const round = useRoundPlay(state.day, 3, moves, true);
  const { submit, failed } = useRoundSubmit(
    state.day,
    3,
    round.plays,
    round.complete,
    `daily-${state.day}`,
  );

  const move = moves[round.index]!;
  const nextIndex = move.kind === 'place' ? move.keyIndex : move.keyIndex + 1;
  const shownIndex = Math.min(nextIndex, keys.length - 1);

  const attempt = (value: string | number) => {
    const outcome = round.attempt(value);
    if (outcome === 'repeat') {
      round.setMessage({
        tone: 'wrong',
        text: `You already tried that. ${dailyMistake(move, value)}`,
        retry: true,
      });
    } else if (outcome === 'wrong') {
      round.setMessage({ tone: 'wrong', text: dailyMistake(move, value), retry: true });
    } else if (outcome === 'right') {
      round.setMessage({ tone: 'right' });
    }
  };

  return (
    <>
      <RoundStrip state={state} current={3} />
      <Card className="mt-4">
        <RoundHeader
          round={3}
          startedAt={state.rounds[2]!.startedAt!}
          penaltyMs={round.penaltyMs}
          total={dayTotalSoFar(state)}
        />
        {round.complete ? (
          <SubmitState failed={failed} onRetry={submit} />
        ) : (
          <>
            <PromptBar title={`Insert ${keys[shownIndex]}`} />
            <p className="bg-highlight text-on-highlight shadow-paper-stack-sm text-body mb-4 flex items-center gap-2 rounded-md px-4 py-3 font-bold">
              <Info className="h-5 w-5 shrink-0" aria-hidden />
              Order {DAILY_ORDER}: at most {DAILY_ORDER - 1} keys in a node
            </p>

            <DailyBoard
              key={round.solved}
              move={move}
              keys={keys}
              hint={round.play.hint}
              onAttempt={attempt}
            />

            <div className="mt-4 flex flex-wrap items-start gap-3">
              {round.play.hint ? (
                <div
                  className="bg-highlight text-on-highlight text-small flex-1 rounded-lg p-4"
                  role="note"
                  aria-label="Hint"
                >
                  <p className="flex items-center gap-1.5 font-bold">
                    <Lightbulb className="h-4 w-4" aria-hidden />
                    Hint for this step
                  </p>
                  <p className="mt-1">{dailyHint(move)}</p>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={round.takeHint}>
                  <Lightbulb className="h-4 w-4" aria-hidden />
                  Hint (+{DAILY_HINT_PENALTY_MS / 1000}s)
                </Button>
              )}
            </div>
          </>
        )}
        <FeedbackBox
          message={round.message}
          idle={`A wrong move adds ${DAILY_WRONG_PENALTY_MS / 1000}s and you try again. A hint adds ${DAILY_HINT_PENALTY_MS / 1000}s.`}
        />
      </Card>
    </>
  );
}
