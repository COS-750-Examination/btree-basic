import {
  DAILY_KEY_COUNT,
  DAILY_ORDER,
  buildTree,
  createTree,
  dailyMoves,
  dailyTally,
} from '@btree/engine';
import {
  DAILY_HINT_PENALTY_MS,
  DAILY_MAX_SCORE,
  DAILY_POINTS_PER_SECOND,
  DAILY_WRONG_PENALTY_MS,
  DailyPlay,
  dailyPenaltyMs,
  type DailyEntry,
  type DailyState,
} from '@btree/shared';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Clock, Lightbulb, Trophy } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useDaily, useFinishDaily, useMe, useStartDaily } from '../api/hooks';
import { DailyBoard } from '../components/daily/DailyBoard';
import { BTreeView } from '../components/tree/BTreeView';
import { Avatar, Button, ButtonLink, Card, CardTitle, PageHeader, cn } from '../components/ui';
import { dailyHint, dailyMistake } from '../lib/dailyHints';
import { useProgressStore } from '../stores/progressStore';

const formatScore = (score: number) => score.toFixed(2);

function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

const storageKey = (day: string) => `daily-steps:${day}`;

function loadPlays(day: string): DailyPlay[] {
  try {
    const raw = localStorage.getItem(storageKey(day));
    const parsed = DailyPlay.array().safeParse(raw ? JSON.parse(raw) : []);
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

function savePlays(day: string, plays: DailyPlay[]): void {
  try {
    localStorage.setItem(storageKey(day), JSON.stringify(plays));
  } catch {
    return;
  }
}

function clearPlays(day: string): void {
  try {
    localStorage.removeItem(storageKey(day));
  } catch {
    return;
  }
}

function Countdown({ resetsAt }: { resetsAt: string }) {
  const now = useNow(30_000);
  const qc = useQueryClient();
  const left = Date.parse(resetsAt) - now;
  useEffect(() => {
    if (left <= 0) void qc.invalidateQueries({ queryKey: ['daily'] });
  }, [left, qc]);
  const mins = Math.max(0, Math.ceil(left / 60_000));
  const text = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
  return <span>New tree in {text}</span>;
}

export function DailyPage() {
  const me = useMe();
  const signedIn = Boolean(me.data);
  const daily = useDaily(signedIn);

  if (me.isPending) return <p className="text-ink-muted">Loading…</p>;

  if (!signedIn) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader title="Daily b-tree" subtitle="A new tree to build every day" />
        <Card className="text-center">
          <p>Sign in to play the Daily b-tree and compare scores with your friends.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <ButtonLink to="/login?next=%2Fdaily">Sign in</ButtonLink>
            <ButtonLink to="/register?next=%2Fdaily" variant="outline">
              Create an account
            </ButtonLink>
          </div>
        </Card>
      </div>
    );
  }

  const state = daily.data;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Daily b-tree"
        subtitle="Same keys for everyone today. Build the tree right, and fast, to top your friends."
      />
      {daily.isPending && <p className="text-ink-muted">Loading today's tree…</p>}
      {daily.isError && (
        <Card>
          <p>We couldn't load today's tree. Check your connection and try again.</p>
          <Button className="mt-3" onClick={() => void daily.refetch()}>
            Try again
          </Button>
        </Card>
      )}
      {state && !state.startedAt && <Intro state={state} />}
      {state && state.startedAt && !state.result && <Game key={state.day} state={state} />}
      {state?.result && <Results state={state} />}
    </div>
  );
}

function Intro({ state }: { state: DailyState }) {
  const start = useStartDaily();
  return (
    <Card>
      <CardTitle className="flex items-center gap-2">
        <CalendarDays className="h-5 w-5" aria-hidden />
        Today's tree
      </CardTitle>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          You get {DAILY_KEY_COUNT} keys to insert, one at a time, into an order-{DAILY_ORDER}{' '}
          B-tree. The first one starts in the root.
        </li>
        <li>Drag the numbers, in order, onto the leaf each one belongs in.</li>
        <li>
          If a node ends up with too many keys, drag the key that moves up into the node above it,
          or tap that key and press <strong>Split and move up</strong>.
        </li>
        <li>You can also tap a number or key, then tap where it goes.</li>
        <li>
          A wrong move adds {DAILY_WRONG_PENALTY_MS / 1000}s to your time and you try again. Stuck?
          Each step has a hint, but it adds {DAILY_HINT_PENALTY_MS / 1000}s.
        </li>
        <li>
          Your score is out of {DAILY_MAX_SCORE}: you lose {DAILY_POINTS_PER_SECOND} points for
          every second of your final time (clock plus penalties).
        </li>
        <li>
          You get <strong>one go a day</strong>. The clock starts when you press Start and keeps
          running if you leave the page.
        </li>
      </ul>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Button onClick={() => start.mutate()} disabled={start.isPending}>
          {start.isPending ? 'Starting…' : 'Start'}
        </Button>
        <span className="text-small text-ink-muted">
          <Countdown resetsAt={state.resetsAt} />
        </span>
      </div>
      {start.isError && (
        <p role="alert" className="text-danger-text text-small mt-3 font-bold">
          Couldn't start. Try again.
        </p>
      )}
    </Card>
  );
}

type Message = { tone: 'right' } | { tone: 'wrong'; text: string };

function Game({ state }: { state: DailyState }) {
  const keys = state.keys!;
  const moves = useMemo(() => dailyMoves(keys), [keys]);
  const [plays, setPlays] = useState(() => loadPlays(state.day).slice(0, moves.length));
  const [message, setMessage] = useState<Message | null>(null);
  const finish = useFinishDaily();
  const qc = useQueryClient();
  const recordAttempt = useProgressStore((s) => s.recordAttempt);
  const sent = useRef(false);
  const now = useNow();
  const elapsed = now - Date.parse(state.startedAt!);

  const solved = plays.filter((p, i) => p.tries.at(-1) === moves[i]?.answer).length;
  const complete = solved >= moves.length;
  const move = moves[Math.min(solved, moves.length - 1)]!;
  const play = plays[solved] ?? { tries: [], hint: false };
  const tally = dailyTally(moves, plays);
  const penaltyMs = dailyPenaltyMs(tally.mistakes, tally.hints);

  const update = (next: DailyPlay[]) => {
    setPlays(next);
    savePlays(state.day, next);
  };

  const submit = () => {
    sent.current = true;
    finish.mutate(
      { day: state.day, plays },
      {
        onSuccess: (s) => {
          clearPlays(state.day);
          qc.setQueryData(['daily'], s);
          if (s.result) {
            recordAttempt({
              itemId: `daily-${state.day}`,
              objective: 'O6',
              correct: s.result.mistakes === 0 && s.result.hints === 0,
              firstAttempt: true,
              hintsUsed: s.result.hints,
            });
          }
        },
      },
    );
  };

  useEffect(() => {
    if (complete && !sent.current) submit();
  });

  const attempt = (value: string | number) => {
    if (complete) return;
    const right = value === move.answer;
    if (!right && play.tries.includes(value)) {
      setMessage({ tone: 'wrong', text: `You already tried that. ${dailyMistake(move, value)}` });
      return;
    }
    const next = [...plays.slice(0, solved), { ...play, tries: [...play.tries, value] }];
    update(next);
    setMessage(right ? { tone: 'right' } : { tone: 'wrong', text: dailyMistake(move, value) });
  };

  const takeHint = () => {
    if (complete || play.hint) return;
    update([...plays.slice(0, solved), { ...play, hint: true }]);
  };

  const wrong = message?.tone === 'wrong' ? message : null;
  const nextIndex = move.kind === 'place' ? move.keyIndex : move.keyIndex + 1;
  const shownIndex = Math.min(nextIndex, keys.length - 1);

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-label font-bold">
          Key {shownIndex + 1} of {keys.length}
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
        </div>
      </div>

      {complete ? (
        <div className="py-8 text-center">
          {finish.isError ? (
            <>
              <p className="text-danger-text font-bold" role="alert">
                Couldn't save your score.
              </p>
              <Button className="mt-3" onClick={submit}>
                Try again
              </Button>
            </>
          ) : (
            <p className="text-ink-muted">Saving your score…</p>
          )}
        </div>
      ) : (
        <>
          <h2 className="text-heading">Insert {keys[shownIndex]}</h2>
          <p className="text-small mt-1">
            Drag the next number onto its leaf. If a node gets too many keys, drag the key that
            moves up into the node above.
          </p>
          <p className="text-small text-ink-muted mt-1 mb-4">
            Order {DAILY_ORDER}: at most {DAILY_ORDER - 1} keys in a node.
          </p>

          <DailyBoard key={solved} move={move} keys={keys} hint={play.hint} onAttempt={attempt} />

          <div className="mt-4 flex flex-wrap items-start gap-3">
            {play.hint ? (
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
              <Button variant="outline" size="sm" onClick={takeHint}>
                <Lightbulb className="h-4 w-4" aria-hidden />
                Hint (+{DAILY_HINT_PENALTY_MS / 1000}s)
              </Button>
            )}
          </div>
        </>
      )}

      <div
        aria-live="polite"
        className={cn(
          'text-small mt-5 rounded-lg border-2 border-dashed p-4',
          wrong ? 'border-danger' : message ? 'border-leaf' : 'border-ink/50 text-ink-muted',
        )}
      >
        {wrong ? (
          <>
            <strong>Not quite (+{DAILY_WRONG_PENALTY_MS / 1000}s). </strong>
            {wrong.text} Try again.
          </>
        ) : message ? (
          <strong>Correct!</strong>
        ) : (
          `A wrong move adds ${DAILY_WRONG_PENALTY_MS / 1000}s and you try again. A hint adds ${DAILY_HINT_PENALTY_MS / 1000}s.`
        )}
      </div>
    </Card>
  );
}

function Results({ state }: { state: DailyState }) {
  const result = state.result!;
  const finalTree = useMemo(
    () => buildTree(createTree(DAILY_ORDER), state.keys ?? []),
    [state.keys],
  );
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
  return (
    <>
      <Card tone="accent">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-label font-bold">Your score today</p>
            <p className="font-display text-display-xl">
              {formatScore(result.score)}
              <span className="text-heading"> / {DAILY_MAX_SCORE}</span>
            </p>
          </div>
          <dl className="text-label grid grid-cols-[auto_auto] gap-x-4 gap-y-1">
            <dt>Clock</dt>
            <dd className="font-bold">{formatTime(result.timeMs)}</dd>
            <dt>{plural(result.mistakes, 'wrong move')}</dt>
            <dd className="font-bold">+{formatTime(result.mistakes * DAILY_WRONG_PENALTY_MS)}</dd>
            <dt>{plural(result.hints, 'hint')}</dt>
            <dd className="font-bold">+{formatTime(result.hints * DAILY_HINT_PENALTY_MS)}</dd>
            <dt className="font-bold">Final time</dt>
            <dd className="font-bold">{formatTime(result.finalMs)}</dd>
          </dl>
          <p className="text-small w-full">
            <Countdown resetsAt={state.resetsAt} />
          </p>
        </div>
      </Card>

      <Card>
        <CardTitle>Today's finished tree</CardTitle>
        <p className="text-small text-ink-muted">Keys in order: {state.keys?.join(', ')}</p>
        <div className="mt-3 rounded-lg bg-sky-200">
          <BTreeView tree={finalTree} scene label="The finished tree for today" />
        </div>
      </Card>

      <Leaderboard entries={state.leaderboard ?? []} />
    </>
  );
}

const PODIUM = [
  { place: 2, height: 'h-20', tone: 'bg-cloud' },
  { place: 1, height: 'h-28', tone: 'bg-highlight' },
  { place: 3, height: 'h-14', tone: 'bg-paper-back' },
] as const;

export function Leaderboard({ entries }: { entries: DailyEntry[] }) {
  const rest = entries.slice(3);
  return (
    <Card>
      <CardTitle className="flex items-center gap-2">
        <Trophy className="h-5 w-5" aria-hidden />
        Today's leaderboard
      </CardTitle>
      <p className="text-small text-ink-muted">
        Only you and your friends appear here. It starts fresh every day.
      </p>

      <ol aria-label="Podium" className="mt-6 flex items-end justify-center gap-3">
        {PODIUM.map(({ place, height, tone }) => {
          const e = entries[place - 1];
          return (
            <li
              key={place}
              className={cn(
                'flex w-28 flex-col items-center',
                place === 1 && 'order-2',
                place === 2 && 'order-1',
                place === 3 && 'order-3',
              )}
              aria-label={
                e
                  ? `${ordinal(place)}: ${e.displayName}, ${formatScore(e.score)} points`
                  : `${ordinal(place)}: nobody yet`
              }
            >
              {e ? (
                <>
                  <Avatar name={e.displayName} size="lg" />
                  <p className="text-label mt-1 w-full truncate text-center font-bold">
                    {e.displayName}
                    {e.isMe && ' (you)'}
                  </p>
                  <p className="text-small">
                    {formatScore(e.score)} · {formatTime(e.finalMs)}
                  </p>
                </>
              ) : (
                <p className="text-small text-ink-muted mb-1">Nobody yet</p>
              )}
              <div
                aria-hidden
                className={cn(
                  'shadow-paper-stack-sm font-display text-display-l mt-2 grid w-full place-items-start justify-center rounded-t-md pt-2',
                  height,
                  tone,
                  e?.isMe && 'ring-yarn ring-4',
                )}
              >
                {place}
              </div>
            </li>
          );
        })}
      </ol>

      {rest.length > 0 && (
        <ol aria-label="Everyone else" className="mt-6 space-y-2" start={4}>
          {rest.map((e) => (
            <li
              key={e.userId}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2',
                e.isMe ? 'bg-highlight text-on-highlight' : 'bg-sky-100',
              )}
            >
              <span className="font-display w-8 text-right">{e.rank}</span>
              <Avatar name={e.displayName} />
              <span className="min-w-0 flex-1 truncate font-bold">
                {e.displayName}
                {e.isMe && ' (you)'}
              </span>
              <span className="text-small">{formatTime(e.finalMs)}</span>
              <span className="font-bold">{formatScore(e.score)}</span>
            </li>
          ))}
        </ol>
      )}

      {entries.length <= 1 && (
        <p className="text-small mt-6 text-center">
          None of your friends have played yet today.{' '}
          <Link to="/account" className="font-bold underline">
            Add friends
          </Link>{' '}
          to compare scores.
        </p>
      )}
    </Card>
  );
}

function ordinal(n: number): string {
  return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`;
}
