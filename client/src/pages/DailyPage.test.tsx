import { DAILY_BROKEN, DAILY_VALID, pathRound, validRound, type BTreeNode } from '@btree/engine';
import type { DailyEntry, DailyRoundResult, DailyState } from '@btree/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api/client';
import { nodeLabel } from '../lib/dailyHints';
import { DailyPage } from './DailyPage';

const signedIn = { user: { id: 'me', displayName: 'Me', email: 'me@x.za', theme: null } };
const now = () => new Date().toISOString();

function trio(over: Partial<DailyState> = {}): DailyState {
  return {
    day: '2026-11-15',
    resetsAt: '2099-01-01T00:00:00.000Z',
    rounds: [1, 2, 3].map((round) => ({ round, startedAt: null, result: null })),
    content: { path: null, valid: null, build: null },
    total: null,
    leaderboard: null,
    ...over,
  };
}

const result = (score: number, extra: Partial<DailyRoundResult> = {}): DailyRoundResult => ({
  score,
  timeMs: 30_000,
  penaltyMs: 0,
  finalMs: 30_000,
  mistakes: 0,
  hints: 0,
  moves: 4,
  ...extra,
});

const pathContent = { keys: [40, 20, 60, 10, 30, 50, 70, 25, 55, 65], seed: 7 };
const validContent = {
  keySets: [
    [12, 45, 7, 33, 81, 60],
    [5, 18, 27, 90, 64, 41],
    [3, 70, 52, 16, 38, 95],
    [22, 8, 77, 49, 61, 30],
  ],
  seed: 9,
};

const entry = (
  name: string,
  scores: { total: number; path: number; valid: number; build: number },
  isMe = false,
): DailyEntry => ({ userId: name, displayName: name, isMe, ...scores });

function mockGet(daily: DailyState, session: unknown = signedIn) {
  vi.spyOn(api, 'get').mockImplementation(((path: string) =>
    Promise.resolve(path === '/auth/session' ? session : daily)) as never);
}

function mockPost(reply: (path: string) => DailyState) {
  return vi
    .spyOn(api, 'post')
    .mockImplementation(((path: string) => Promise.resolve(reply(path))) as never);
}

function show() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <DailyPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('DailyPage', () => {
  it('asks guests to sign in', async () => {
    mockGet(trio(), { user: null });
    show();
    expect(await screen.findByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login?next=%2Fdaily',
    );
  });

  it('introduces the three rounds and starts round 1', async () => {
    mockGet(trio());
    const post = mockPost(() => trio());
    show();
    expect(await screen.findByText(/Round 1 · Find the path/)).toBeInTheDocument();
    expect(screen.getByText(/Round 2 · Valid or not\?/)).toBeInTheDocument();
    expect(screen.getByText(/Round 3 · Build it/)).toBeInTheDocument();
    expect(screen.getAllByText('(up to 100 points)')).toHaveLength(3);
    await userEvent.click(screen.getByRole('button', { name: 'Start round 1' }));
    expect(post).toHaveBeenCalledWith('/daily/rounds/1/start', {}, expect.anything());
  });

  it('plays Find the path one branch at a time and keeps you in place after a wrong branch', async () => {
    const started = trio({
      rounds: [
        { round: 1, startedAt: now(), result: null },
        { round: 2, startedAt: null, result: null },
        { round: 3, startedAt: null, result: null },
      ],
      content: { path: pathContent, valid: null, build: null },
    });
    mockGet(started);
    const after = trio({
      rounds: [
        { round: 1, startedAt: now(), result: result(88.5, { mistakes: 1 }) },
        { round: 2, startedAt: null, result: null },
        { round: 3, startedAt: null, result: null },
      ],
    });
    const post = mockPost(() => after);
    const { tree, moves, searches } = pathRound(pathContent.keys, pathContent.seed);
    const nodes = new Map<string, BTreeNode>();
    const walk = (n: BTreeNode) => {
      nodes.set(n.id, n);
      n.children.forEach(walk);
    };
    walk(tree.root!);
    show();

    expect(
      await screen.findByRole('heading', { name: `Find ${searches[0]!.target}` }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Search 1 of 3 · tap one branch at a time/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /hint/i })).not.toBeInTheDocument();

    const first = moves[0]!;
    const wrongChild = nodes.get(first.at)!.children.find((c) => c.id !== first.answer)!;
    await userEvent.click(screen.getByRole('button', { name: nodeLabel(wrongChild.keys) }));
    expect(screen.getByRole('status')).toHaveTextContent(
      /Not quite \(\+10s\)\. .*branch\. Try again\./,
    );
    expect(screen.getByLabelText('Penalties 0:10')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: nodeLabel(wrongChild.keys) })).toBeInTheDocument();

    for (const m of moves) {
      const button = await screen.findByRole(
        'button',
        { name: nodeLabel(nodes.get(m.answer)!.keys) },
        { timeout: 2000 },
      );
      await userEvent.click(button);
    }

    expect(await screen.findByText('+88.50', {}, { timeout: 2500 })).toBeInTheDocument();
    expect(post).toHaveBeenCalledWith(
      '/daily/rounds/1/finish',
      {
        day: '2026-11-15',
        plays: moves.map((m, i) => ({
          tries: i === 0 ? [wrongChild.id, m.answer] : [m.answer],
          hint: false,
        })),
      },
      expect.anything(),
    );
    expect(screen.getByRole('button', { name: 'Start round 2' })).toBeInTheDocument();
  });

  it('plays Valid or not? with one answer per tree', async () => {
    const started = trio({
      rounds: [
        { round: 1, startedAt: now(), result: result(90) },
        { round: 2, startedAt: now(), result: null },
        { round: 3, startedAt: null, result: null },
      ],
      content: { path: pathContent, valid: validContent, build: null },
    });
    mockGet(started);
    const post = mockPost(() => started);
    const items = validRound(validContent.keySets, validContent.seed);
    show();

    for (const [i, item] of items.entries()) {
      expect(
        await screen.findByText(`Tree ${i + 1} of 4 · order 3`, {}, { timeout: 2000 }),
      ).toBeInTheDocument();
      const wrong = i === 0;
      const saysValid = (item.answer === DAILY_VALID) !== wrong;
      await userEvent.click(
        screen.getByRole('button', { name: saysValid ? 'Valid B-tree' : "Something's broken" }),
      );
      expect(screen.getByRole('button', { name: 'Valid B-tree' })).toBeDisabled();
      expect(screen.getByRole('status')).toHaveTextContent(item.reason);
      if (wrong) {
        expect(screen.getByRole('status')).toHaveTextContent(/Not quite \(\+10s\)/);
        await userEvent.click(screen.getByRole('button', { name: 'Next tree' }));
      }
    }

    await vi.waitFor(() => expect(post).toHaveBeenCalled(), { timeout: 2000 });
    expect(post).toHaveBeenCalledWith(
      '/daily/rounds/2/finish',
      {
        day: '2026-11-15',
        plays: items.map((item, i) => ({
          tries: [
            i === 0 ? (item.answer === DAILY_VALID ? DAILY_BROKEN : DAILY_VALID) : item.answer,
          ],
          hint: false,
        })),
      },
      expect.anything(),
    );
  });

  it('keeps Build it as it was: first key in the root, hints, split button', async () => {
    const started = trio({
      rounds: [
        { round: 1, startedAt: now(), result: result(90) },
        { round: 2, startedAt: now(), result: result(80) },
        { round: 3, startedAt: now(), result: null },
      ],
      content: { path: pathContent, valid: validContent, build: { keys: [20, 8, 12] } },
    });
    mockGet(started);
    const post = mockPost(() => started);
    show();

    expect(await screen.findByRole('heading', { name: 'Insert 8' })).toBeInTheDocument();
    expect(screen.getByText('Day total 56.67')).toBeInTheDocument();
    expect(screen.getByText('Order 3: at most 2 keys in a node')).toBeInTheDocument();
    expect(screen.queryByText(/Key \d of \d/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Node with keys 20' }));
    await userEvent.click(await screen.findByRole('button', { name: /Hint \(\+30s\)/ }));
    expect(screen.getByRole('note', { name: 'Hint' })).toHaveTextContent(
      'There is only one node, so 12 goes there.',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Node with keys 8, 20' }));
    expect(document.querySelector('rect[fill="var(--danger)"]')).toBeNull();
    await userEvent.click(await screen.findByRole('button', { name: 'Key 8' }));
    await userEvent.click(screen.getByRole('button', { name: 'Split and move up' }));
    expect(screen.getByText(/That's not the middle key\. Try again\./)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Key 12' }));
    await userEvent.click(screen.getByRole('button', { name: 'Split and move up' }));

    await vi.waitFor(() => expect(post).toHaveBeenCalled());
    expect(post).toHaveBeenCalledWith(
      '/daily/rounds/3/finish',
      {
        day: '2026-11-15',
        plays: [
          { tries: ['n1'], hint: false },
          { tries: ['n1'], hint: true },
          { tries: [8, 12], hint: false },
        ],
      },
      expect.anything(),
    );
  });

  it('shows the round strip and a pause card between rounds', async () => {
    mockGet(
      trio({
        rounds: [
          { round: 1, startedAt: now(), result: result(82.1) },
          { round: 2, startedAt: null, result: null },
          { round: 3, startedAt: null, result: null },
        ],
      }),
    );
    show();
    const strip = await screen.findByRole('list', { name: "Today's rounds" });
    expect(within(strip).getByText('82.10')).toBeInTheDocument();
    expect(within(strip).getAllByText('Up to 100 points')).toHaveLength(2);
    expect(screen.getByText('+82.10')).toBeInTheDocument();
    expect(screen.getByText('The clock is paused until you start.')).toBeInTheDocument();
  });

  it('shows the total, your place, each round, and a leaderboard you can sort by round', async () => {
    const people = [
      entry('Ayanda', { total: 90, path: 70, valid: 100, build: 100 }),
      entry('Me', { total: 85, path: 95, valid: 80, build: 80 }, true),
      entry('Lerato', { total: 80, path: 90, valid: 70, build: 80 }),
      entry('Thabo', { total: 70, path: 60, valid: 75, build: 75 }),
      entry('Zanele', { total: 60, path: 99, valid: 40, build: 41 }),
    ];
    mockGet(
      trio({
        rounds: [
          { round: 1, startedAt: now(), result: result(95, { mistakes: 1 }) },
          { round: 2, startedAt: now(), result: result(80, { mistakes: 1 }) },
          { round: 3, startedAt: now(), result: result(80, { hints: 1, penaltyMs: 30_000 }) },
        ],
        content: { path: pathContent, valid: validContent, build: { keys: [20, 8, 12] } },
        total: 85,
        leaderboard: people,
      }),
    );
    show();

    expect(await screen.findByText('You came 2nd of 5 today')).toBeInTheDocument();
    expect(screen.queryByText(/\/ 100/)).not.toBeInTheDocument();
    expect(screen.getByText('3 of 4 right · 0:30')).toBeInTheDocument();
    expect(screen.getByText(/1 hint \(\+0:30\)/)).toBeInTheDocument();

    const podium = () => screen.getByRole('list', { name: /Podium/ });
    expect(within(podium()).getByRole('listitem', { name: /1st: Ayanda/ })).toBeInTheDocument();
    const rest = () =>
      within(screen.getByRole('list', { name: 'Everyone else' })).getAllByRole('listitem');
    expect(rest()[0]).toHaveTextContent(/^4.*Thabo.*Path 60\.00.*Valid 75\.00.*Build 75\.00/);

    await userEvent.click(screen.getByRole('tab', { name: 'Path' }));
    expect(
      within(podium()).getByRole('listitem', { name: /1st: Zanele, 99\.00/ }),
    ).toBeInTheDocument();
    expect(within(podium()).getByRole('listitem', { name: /2nd: Me, 95\.00/ })).toBeInTheDocument();
    expect(rest().map((li) => li.textContent)).toEqual([
      expect.stringMatching(/^4.*Ayanda/),
      expect.stringMatching(/^5.*Thabo/),
    ]);
  });
});
