import type { DailyEntry, DailyState } from '@btree/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api/client';
import { DailyPage } from './DailyPage';

const signedIn = { user: { id: 'me', displayName: 'Me', email: 'me@x.za', theme: null } };

const base: DailyState = {
  day: '2026-11-15',
  resetsAt: '2099-01-01T00:00:00.000Z',
  startedAt: null,
  keys: null,
  result: null,
  leaderboard: null,
};

const entry = (rank: number, displayName: string, isMe = false): DailyEntry => ({
  rank,
  userId: `u${rank}`,
  displayName,
  score: 1000 - rank * 50,
  finalMs: 60_000 + rank * 1000,
  isMe,
});

function mockGet(session: unknown, daily: DailyState) {
  vi.spyOn(api, 'get').mockImplementation(((path: string) =>
    Promise.resolve(path === '/auth/session' ? session : daily)) as never);
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
    mockGet({ user: null }, base);
    show();
    expect(await screen.findByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login?next=%2Fdaily',
    );
  });

  it('builds the tree from the first key and sends every try to be scored', async () => {
    mockGet(signedIn, base);
    const started = { ...base, startedAt: new Date().toISOString(), keys: [20, 8, 12] };
    const finished = {
      ...started,
      result: {
        score: 900,
        timeMs: 10_000,
        penaltyMs: 40_000,
        finalMs: 50_000,
        mistakes: 1,
        hints: 1,
        moves: 7,
      },
      leaderboard: [entry(1, 'Me', true)],
    };
    const post = vi
      .spyOn(api, 'post')
      .mockImplementation(((path: string) =>
        Promise.resolve(path === '/daily/start' ? started : finished)) as never);
    show();

    await userEvent.click(await screen.findByRole('button', { name: 'Start' }));
    expect(await screen.findByRole('heading', { name: 'Insert 20' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Drop 20 here to start the tree' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Next key' }));

    expect(await screen.findByRole('heading', { name: 'Insert 8' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Node with keys 20' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Next key' }));

    expect(await screen.findByRole('heading', { name: 'Insert 12' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Hint \(\+30s\)/ }));
    expect(screen.getByRole('note', { name: 'Hint' })).toHaveTextContent(
      'There is only one node, so 12 goes there.',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Node with keys 8, 20' }));

    expect(await screen.findByRole('heading', { name: 'Insert 12' })).toBeInTheDocument();
    expect(screen.queryByRole('note', { name: 'Hint' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next key' }));
    expect(screen.getByText(/A node has too many keys/)).toBeInTheDocument();
    expect(screen.getByLabelText('Penalties 0:40')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Key 12' }));
    await userEvent.click(screen.getByRole('button', { name: 'New root above the tree' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Next key' }));

    expect(await screen.findByText('Your score today')).toBeInTheDocument();
    expect(post).toHaveBeenCalledWith(
      '/daily/finish',
      {
        day: '2026-11-15',
        plays: [
          { tries: ['root'], hint: false },
          { tries: ['next'], hint: false },
          { tries: ['n1'], hint: false },
          { tries: ['next'], hint: false },
          { tries: ['n1'], hint: true },
          { tries: ['next', 12], hint: false },
          { tries: ['next'], hint: false },
        ],
      },
      expect.anything(),
    );
  });

  it('never marks a full node red unless a hint is taken', async () => {
    const started = { ...base, startedAt: new Date().toISOString(), keys: [20, 8, 12] };
    mockGet(signedIn, started);
    show();

    await userEvent.click(await screen.findByRole('button', { name: /Drop 20/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'Next key' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Node with keys 20' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Next key' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Node with keys 8, 20' }));
    await screen.findByRole('button', { name: 'Next key' });
    expect(document.querySelector('rect[fill="var(--danger)"]')).toBeNull();
    expect(screen.queryByText(/too full/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Hint/ }));
    expect(document.querySelector('rect[fill="var(--danger)"]')).not.toBeNull();
  });

  it('does not charge twice for the same wrong move', async () => {
    const started = { ...base, startedAt: new Date().toISOString(), keys: [20, 8, 12] };
    mockGet(signedIn, started);
    show();

    await userEvent.click(await screen.findByRole('button', { name: /Drop 20/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'Key 20' }));
    await userEvent.click(screen.getByRole('button', { name: 'New root above the tree' }));
    expect(screen.getByText(/No node has too many keys/)).toBeInTheDocument();
    expect(screen.getByLabelText('Penalties 0:10')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Key 20' }));
    await userEvent.click(screen.getByRole('button', { name: 'New root above the tree' }));
    expect(screen.getByText(/You already tried that/)).toBeInTheDocument();
    expect(screen.getByLabelText('Penalties 0:10')).toBeInTheDocument();
  });

  it('puts the top three on a podium and lists everyone else from 4th', async () => {
    const leaderboard = ['Ayanda', 'Me', 'Lerato', 'Thabo', 'Zanele'].map((n, i) =>
      entry(i + 1, n, n === 'Me'),
    );
    mockGet(signedIn, {
      ...base,
      startedAt: new Date().toISOString(),
      keys: [20, 8, 12],
      result: {
        score: 876,
        timeMs: 62_000,
        penaltyMs: 0,
        finalMs: 62_000,
        mistakes: 0,
        hints: 0,
        moves: 1,
      },
      leaderboard,
    });
    show();

    const podium = await screen.findByRole('list', { name: 'Podium' });
    expect(within(podium).getByRole('listitem', { name: /1st: Ayanda/ })).toBeInTheDocument();
    expect(within(podium).getByRole('listitem', { name: /2nd: Me/ })).toBeInTheDocument();
    expect(within(podium).getByRole('listitem', { name: /3rd: Lerato/ })).toBeInTheDocument();
    const rest = within(screen.getByRole('list', { name: 'Everyone else' })).getAllByRole(
      'listitem',
    );
    expect(rest.map((li) => li.textContent)).toEqual([
      expect.stringMatching(/^4.*Thabo/),
      expect.stringMatching(/^5.*Zanele/),
    ]);
  });
});
