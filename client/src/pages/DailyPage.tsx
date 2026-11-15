import { DAILY_ORDER, buildTree, createTree } from '@btree/engine';
import {
  DAILY_HINT_PENALTY_MS,
  DAILY_MAX_SCORE,
  DAILY_ROUNDS,
  DAILY_WRONG_PENALTY_MS,
  type DailyEntry,
  type DailyRoundKey,
  type DailyRoundResult,
  type DailyState,
} from '@btree/shared';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useDaily, useMe, useStartRound } from '../api/hooks';
import { BuildRound } from '../components/daily/BuildRound';
import { PathRound } from '../components/daily/PathRound';
import { RoundStrip } from '../components/daily/RoundChrome';
import { formatScore, formatTime, rankBy, useNow, type LeaderboardTab } from '../lib/dailyFormat';
import { ValidRound } from '../components/daily/ValidRound';
import { BTreeView } from '../components/tree/BTreeView';
import { Avatar, Button, ButtonLink, Card, CardTitle, PageHeader, cn } from '../components/ui';

function Countdown({ resetsAt }: { resetsAt: string }) {
  const now = useNow(30_000);
  const qc = useQueryClient();
  const left = Date.parse(resetsAt) - now;
  useEffect(() => {
    if (left <= 0) void qc.invalidateQueries({ queryKey: ['daily'] });
  }, [left, qc]);
  const mins = Math.max(0, Math.ceil(left / 60_000));
  const text = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
  return <span>New trio in {text}</span>;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
}

type Phase =
  | { kind: 'intro' }
  | { kind: 'pause'; done: number }
  | { kind: 'play'; round: number }
  | { kind: 'results' };

function phaseOf(state: DailyState): Phase {
  if (state.total !== null) return { kind: 'results' };
  const next = state.rounds.find((r) => !r.result);
  if (!next) return { kind: 'results' };
  if (next.startedAt) return { kind: 'play', round: next.round };
  return next.round === 1 ? { kind: 'intro' } : { kind: 'pause', done: next.round - 1 };
}

export function DailyPage() {
  const me = useMe();
  const signedIn = Boolean(me.data);
  const daily = useDaily(signedIn);

  if (me.isPending) return <p className="text-ink-muted">Loading…</p>;

  if (!signedIn) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader title="Daily b-tree" subtitle="Three short B-tree rounds every day" />
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
  const phase = state ? phaseOf(state) : null;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Daily b-tree"
        subtitle="Three rounds, the same for everyone today. Get them right, and fast, to top your friends."
      />
      {daily.isPending && <p className="text-ink-muted">Loading today's trio…</p>}
      {daily.isError && (
        <Card>
          <p>We couldn't load today's trio. Check your connection and try again.</p>
          <Button className="mt-3" onClick={() => void daily.refetch()}>
            Try again
          </Button>
        </Card>
      )}
      {state && phase?.kind === 'intro' && <Intro state={state} />}
      {state && phase?.kind === 'pause' && <PauseCard state={state} done={phase.done} />}
      {state && phase?.kind === 'play' && phase.round === 1 && (
        <PathRound key={`${state.day}-1`} state={state} />
      )}
      {state && phase?.kind === 'play' && phase.round === 2 && (
        <ValidRound key={`${state.day}-2`} state={state} />
      )}
      {state && phase?.kind === 'play' && phase.round === 3 && (
        <BuildRound key={`${state.day}-3`} state={state} />
      )}
      {state && phase?.kind === 'results' && <Results state={state} />}
    </div>
  );
}

function StartButton({ round }: { round: number }) {
  const start = useStartRound();
  return (
    <>
      <Button onClick={() => start.mutate(round)} disabled={start.isPending}>
        {start.isPending ? 'Starting…' : `Start round ${round}`}
      </Button>
      {start.isError && (
        <p role="alert" className="text-danger-text text-small mt-3 w-full font-bold">
          Couldn't start. Try again.
        </p>
      )}
    </>
  );
}

const ROUND_BLURB: Record<DailyRoundKey, string> = {
  path: 'Follow the search from the root to three keys, one branch at a time.',
  valid: 'Four trees. Decide whether each one is a valid B-tree.',
  build: 'Insert 8 keys into an order-3 B-tree, splitting full nodes as you go.',
};

function Intro({ state }: { state: DailyState }) {
  return (
    <Card>
      <CardTitle className="flex items-center gap-2">
        <CalendarDays className="h-5 w-5" aria-hidden />
        Today's trio
      </CardTitle>
      <ol className="space-y-2">
        {DAILY_ROUNDS.map((r) => (
          <li key={r.id} className="rounded-md bg-sky-100 px-3 py-2">
            <p className="font-bold">
              Round {r.id} · {r.label}{' '}
              <span className="text-small text-ink-muted font-normal">
                (up to {DAILY_MAX_SCORE} points)
              </span>
            </p>
            <p className="text-small">{ROUND_BLURB[r.key]}</p>
          </li>
        ))}
      </ol>
      <ul className="text-small mt-4 list-disc space-y-1 pl-5">
        <li>
          Each round starts at {DAILY_MAX_SCORE} and loses points every second of its time:{' '}
          {DAILY_ROUNDS.map((r) => `${r.label} ${r.pointsPerSecond}`).join(', ')} a second. Your
          day's score is the average of the three.
        </li>
        <li>
          A wrong answer adds {DAILY_WRONG_PENALTY_MS / 1000}s. Only Build it has hints, and each
          adds {DAILY_HINT_PENALTY_MS / 1000}s.
        </li>
        <li>
          Each round has its own clock, which pauses between rounds. It keeps running if you leave
          the page during a round.
        </li>
        <li>
          You get <strong>one go a day</strong> at each round.
        </li>
      </ul>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <StartButton round={1} />
        <span className="text-small text-ink-muted">
          <Countdown resetsAt={state.resetsAt} />
        </span>
      </div>
    </Card>
  );
}

function roundNote(round: number, result: DailyRoundResult): string {
  const time = formatTime(result.timeMs);
  if (round === 2) return `${result.moves - result.mistakes} of ${result.moves} right · ${time}`;
  const parts = [time, plural(result.mistakes, 'mistake')];
  if (result.hints) {
    parts.push(
      `${plural(result.hints, 'hint')} (+${formatTime(result.hints * DAILY_HINT_PENALTY_MS)})`,
    );
  }
  return parts.join(' · ');
}

function PauseCard({ state, done }: { state: DailyState; done: number }) {
  const result = state.rounds[done - 1]!.result!;
  const label = DAILY_ROUNDS.find((r) => r.id === done)!.label;
  return (
    <>
      <RoundStrip state={state} current={null} />
      <Card className="text-center">
        <p className="text-label font-bold">
          Round {done} · {label} done
        </p>
        <p className="font-display text-display-xl">+{formatScore(result.score)}</p>
        <p className="text-small">{roundNote(done, result)}</p>
        <p className="text-small text-ink-muted mt-2">The clock is paused until you start.</p>
        <div className="mt-4 flex flex-wrap justify-center">
          <StartButton round={done + 1} />
        </div>
      </Card>
    </>
  );
}

function Results({ state }: { state: DailyState }) {
  const entries = state.leaderboard ?? [];
  const myRank = entries.findIndex((e) => e.isMe) + 1;
  const buildKeys = state.content.build?.keys;
  const finalTree = useMemo(() => buildTree(createTree(DAILY_ORDER), buildKeys ?? []), [buildKeys]);
  return (
    <>
      <RoundStrip state={state} current={null} />
      <Card tone="accent">
        <p className="text-label font-bold">Your score today</p>
        <p className="font-display text-display-xl">{formatScore(state.total ?? 0)}</p>
        <p className="font-bold">
          {entries.length > 1
            ? `You came ${ordinal(myRank)} of ${entries.length} today`
            : 'You are the first of your friends to finish today'}
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {DAILY_ROUNDS.map((r) => {
            const result = state.rounds[r.id - 1]!.result!;
            return (
              <li key={r.id} className="bg-paper text-ink rounded-md p-3">
                <p className="text-small font-bold">
                  {r.id} · {r.label}
                </p>
                <p className="font-display text-heading">{formatScore(result.score)}</p>
                <p className="text-small">{roundNote(r.id, result)}</p>
              </li>
            );
          })}
        </ul>
        <p className="text-small mt-3">
          <Countdown resetsAt={state.resetsAt} />
        </p>
      </Card>

      <Card>
        <CardTitle>Today's built tree</CardTitle>
        <p className="text-small text-ink-muted">Keys in order: {buildKeys?.join(', ')}</p>
        <div className="mt-3 rounded-lg bg-sky-200">
          <BTreeView tree={finalTree} scene label="The finished tree from Build it" />
        </div>
      </Card>

      <Leaderboard entries={entries} />
    </>
  );
}

const TABS = [
  { key: 'total', label: 'Total' },
  { key: 'path', label: 'Path' },
  { key: 'valid', label: 'Valid' },
  { key: 'build', label: 'Build' },
] as const;

type TabKey = LeaderboardTab;

const CHIPS = [
  { key: 'path', label: 'Path' },
  { key: 'valid', label: 'Valid' },
  { key: 'build', label: 'Build' },
] as const;

const PODIUM = [
  { place: 2, medal: 'bg-bunting-blue text-on-highlight', lift: 'mt-8', score: 'text-display-l' },
  { place: 1, medal: 'bg-sun text-on-highlight', lift: '', score: 'text-display-xl' },
  { place: 3, medal: 'bg-coral text-on-highlight', lift: 'mt-12', score: 'text-display-l' },
] as const;

const AVATAR_TONES = [
  'bg-blossom text-on-highlight',
  'bg-bunting-blue text-on-highlight',
  'bg-leaf-light text-on-highlight',
  'bg-sun text-on-highlight',
  'bg-coral text-on-highlight',
];

function avatarTone(e: DailyEntry): string {
  if (e.isMe) return 'bg-leaf text-on-leaf';
  const hash = [...e.userId].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  return AVATAR_TONES[hash % AVATAR_TONES.length]!;
}

function Chips({ entry, tab, light }: { entry: DailyEntry; tab: TabKey; light: boolean }) {
  return (
    <span className="flex flex-wrap justify-center gap-1">
      {CHIPS.map((c) => (
        <span
          key={c.key}
          className={cn(
            'text-small rounded-sm px-2 py-0.5 font-bold',
            tab === c.key
              ? 'bg-leaf text-on-leaf'
              : light
                ? 'bg-node-fill text-ink'
                : 'text-ink bg-sky-200',
          )}
        >
          {c.label} {formatScore(entry[c.key])}
        </span>
      ))}
    </span>
  );
}

export function Leaderboard({ entries }: { entries: DailyEntry[] }) {
  const [tab, setTab] = useState<TabKey>('total');
  const sorted = rankBy(entries, tab);
  const rest = sorted.slice(3);
  const tabLabel = TABS.find((t) => t.key === tab)!.label;
  return (
    <section aria-labelledby="leaderboard-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="leaderboard-title" className="font-display text-display-l flex items-center gap-2">
          <Trophy className="h-6 w-6" aria-hidden />
          Today's leaderboard
        </h2>
        <div role="tablist" aria-label="Sort the leaderboard" className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'shadow-paper-stack-sm text-label min-h-11 rounded-md px-4 font-bold',
                tab === t.key ? 'bg-highlight text-on-highlight' : 'bg-paper',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-small text-ink-muted mt-1">
        Only you and your friends appear here. It starts fresh every day.
      </p>

      <ol
        aria-label={`Podium by ${tabLabel}`}
        className="mt-8 grid grid-cols-3 items-start gap-2 sm:gap-4"
      >
        {PODIUM.map(({ place, medal, lift, score }) => {
          const e = sorted[place - 1];
          return (
            <li
              key={place}
              className={cn(
                'relative flex flex-col items-center rounded-lg px-2 pt-8 pb-4 text-center sm:px-4',
                e?.isMe ? 'bg-highlight text-on-highlight' : 'bg-paper',
                'shadow-paper-stack',
                lift,
                place === 1 && 'pt-10 pb-6',
                place === 1 && 'order-2',
                place === 2 && 'order-1',
                place === 3 && 'order-3',
              )}
              aria-label={
                e
                  ? `${ordinal(place)}: ${e.displayName}, ${formatScore(e[tab])} points`
                  : `${ordinal(place)}: nobody yet`
              }
            >
              <span
                aria-hidden
                className={cn(
                  'font-display rounded-pill shadow-lift text-heading absolute -top-5 left-1/2 grid h-10 w-10 -translate-x-1/2 place-items-center',
                  medal,
                )}
              >
                {place}
              </span>
              {e ? (
                <>
                  <Avatar name={e.displayName} size="lg" tone={avatarTone(e)} />
                  <p className="text-label mt-2 w-full truncate font-bold">
                    {e.displayName}
                    {e.isMe && ' (you)'}
                  </p>
                  <p className={cn('font-display', score)}>{formatScore(e[tab])}</p>
                  <div className="mt-2 hidden sm:block">
                    <Chips entry={e} tab={tab} light={e.isMe} />
                  </div>
                </>
              ) : (
                <p className="text-small text-ink-muted mt-2">Nobody yet</p>
              )}
            </li>
          );
        })}
      </ol>

      {rest.length > 0 && (
        <ol aria-label="Everyone else" className="mt-6 space-y-3" start={4}>
          {rest.map((e, i) => (
            <li
              key={e.userId}
              className={cn(
                'shadow-paper-stack-sm flex flex-wrap items-center gap-3 rounded-lg px-4 py-3',
                e.isMe ? 'bg-highlight text-on-highlight' : 'bg-paper',
              )}
            >
              <span className="font-display text-heading w-12">{ordinal(i + 4)}</span>
              <Avatar name={e.displayName} tone={avatarTone(e)} />
              <span className="min-w-0 flex-1 truncate font-bold">
                {e.displayName}
                {e.isMe && ' (you)'}
              </span>
              <Chips entry={e} tab={tab} light={e.isMe} />
              <span className="font-display text-heading w-20 text-right">
                {formatScore(e[tab])}
              </span>
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
    </section>
  );
}
