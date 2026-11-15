import { dailyAnswerTally, dailyTally, type Answerable } from '@btree/engine';
import { DAILY_ROUNDS, DailyPlay, dailyPenaltyMs, type DailyState } from '@btree/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useFinishRound } from '../../api/hooks';
import { useProgressStore } from '../../stores/progressStore';

export type Message = { tone: 'right' | 'wrong'; text?: string; retry?: boolean };

const storageKey = (day: string, round: number) => `daily-steps:${day}:r${round}`;

function loadPlays(day: string, round: number): DailyPlay[] {
  try {
    const raw = localStorage.getItem(storageKey(day, round));
    const parsed = DailyPlay.array().safeParse(raw ? JSON.parse(raw) : []);
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

function savePlays(day: string, round: number, plays: DailyPlay[]): void {
  try {
    localStorage.setItem(storageKey(day, round), JSON.stringify(plays));
  } catch {
    return;
  }
}

function clearPlays(day: string, round: number): void {
  try {
    localStorage.removeItem(storageKey(day, round));
  } catch {
    return;
  }
}

export function buzz(): void {
  try {
    navigator.vibrate?.(80);
  } catch {
    return;
  }
}

export function useRoundPlay(
  day: string,
  round: number,
  moves: readonly Answerable[],
  retry: boolean,
) {
  const [plays, setPlays] = useState(() => loadPlays(day, round).slice(0, moves.length));
  const [message, setMessage] = useState<Message | null>(null);
  const [shakes, setShakes] = useState(0);

  const solved = retry
    ? plays.filter((p, i) => p.tries.at(-1) === moves[i]?.answer).length
    : plays.length;
  const complete = solved >= moves.length;
  const index = Math.min(solved, moves.length - 1);
  const play = plays[solved] ?? { tries: [], hint: false };
  const tally = retry ? dailyTally(moves, plays) : dailyAnswerTally(moves, plays);
  const penaltyMs = dailyPenaltyMs(tally.mistakes, tally.hints);

  const update = (next: DailyPlay[]) => {
    setPlays(next);
    savePlays(day, round, next);
  };

  const attempt = (value: string | number): 'right' | 'wrong' | 'repeat' | 'done' => {
    if (complete) return 'done';
    const right = value === moves[solved]!.answer;
    if (retry && !right && play.tries.includes(value)) return 'repeat';
    update([...plays.slice(0, solved), { ...play, tries: [...play.tries, value] }]);
    if (!right) setShakes((n) => n + 1);
    return right ? 'right' : 'wrong';
  };

  const takeHint = () => {
    if (complete || play.hint) return;
    update([...plays.slice(0, solved), { ...play, hint: true }]);
  };

  return {
    plays,
    solved,
    complete,
    index,
    play,
    penaltyMs,
    message,
    setMessage,
    shakes,
    attempt,
    takeHint,
  };
}

export function useRoundSubmit(
  day: string,
  round: number,
  plays: DailyPlay[],
  ready: boolean,
  itemId: string,
) {
  const finish = useFinishRound(round);
  const qc = useQueryClient();
  const recordAttempt = useProgressStore((s) => s.recordAttempt);
  const sent = useRef(false);
  const objective = DAILY_ROUNDS.find((r) => r.id === round)!.objective;

  const submit = () => {
    sent.current = true;
    finish.mutate(
      { day, plays },
      {
        onSuccess: (state: DailyState) => {
          clearPlays(day, round);
          qc.setQueryData(['daily'], state);
          const result = state.rounds[round - 1]?.result;
          if (result) {
            recordAttempt({
              itemId,
              objective,
              correct: result.mistakes === 0 && result.hints === 0,
              firstAttempt: true,
              hintsUsed: result.hints,
            });
          }
        },
      },
    );
  };

  useEffect(() => {
    if (ready && !sent.current) submit();
  });

  return { submit, failed: finish.isError };
}
