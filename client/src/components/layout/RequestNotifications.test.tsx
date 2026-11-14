import type { FriendsList } from '@btree/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../api/client';
import { AccountPage } from '../../pages/AccountPage';
import { Header } from './Header';

const session = {
  user: {
    id: 'me',
    email: 'me@tuks.co.za',
    displayName: 'Me Student',
    theme: null,
    plantedAt: '2026-11-01T00:00:00.000Z',
  },
};

const friends = (requestsSeenAt: string | null): FriendsList => ({
  friends: [],
  outgoing: [],
  incoming: [
    { id: 'r1', fromName: 'Sam', sentAt: '2026-11-14T08:00:00.000Z' },
    { id: 'r2', fromName: 'Lerato', sentAt: '2026-11-15T09:00:00.000Z' },
  ],
  requestsSeenAt,
});

function mockApi(list: FriendsList) {
  vi.spyOn(api, 'get').mockImplementation(((path: string) =>
    Promise.resolve(
      path === '/auth/session'
        ? session
        : path === '/friends'
          ? list
          : path === '/invites/mine'
            ? { code: 'K7Q2XMAB' }
            : [],
    )) as never);
}

function show(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => vi.restoreAllMocks());

describe('friend request notifications', () => {
  it('shows how many new requests there are on the account circle', async () => {
    mockApi(friends(null));
    show(<Header />);
    expect(
      await screen.findByRole('link', { name: 'Account: Me Student, 2 new friend requests' }),
    ).toBeInTheDocument();
  });

  it('only counts requests newer than the last visit', async () => {
    mockApi(friends('2026-11-14T08:00:00.000Z'));
    show(<Header />);
    expect(
      await screen.findByRole('link', { name: 'Account: Me Student, 1 new friend request' }),
    ).toBeInTheDocument();
  });

  it('shows no counter once everything has been seen', async () => {
    mockApi(friends('2026-11-15T09:00:00.000Z'));
    show(<Header />);
    expect(await screen.findByRole('link', { name: 'Account: Me Student' })).toBeInTheDocument();
  });

  it('marks requests as seen when the Account page is opened', async () => {
    mockApi(friends('2026-11-14T08:00:00.000Z'));
    const post = vi.spyOn(api, 'post').mockResolvedValue(undefined);
    show(<AccountPage />);
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/friends/requests/seen', {
        upTo: '2026-11-15T09:00:00.000Z',
      }),
    );
  });
});
