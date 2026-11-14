import type { FriendsList } from '@btree/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError, api } from '../../api/client';
import { FriendsCard } from './FriendsCard';

const list: FriendsList = {
  friends: [
    { id: 'f1', displayName: 'Sam Moyo', stage: 'sapling', modulesDone: 3, since: '2026-11-01' },
  ],
  incoming: [{ id: 'in1', fromName: 'Lerato', sentAt: '2026-11-15T08:00:00.000Z' }],
  outgoing: [{ id: 'out1', email: 'thabo@tuks.co.za', sentAt: '2026-11-14T08:00:00.000Z' }],
  requestsSeenAt: null,
};

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

let get: ReturnType<typeof vi.fn>;
beforeEach(() => {
  get = vi.fn((path: string) =>
    Promise.resolve(path === '/invites/mine' ? { code: 'K7Q2XMAB' } : list),
  );
  vi.spyOn(api, 'get').mockImplementation(get as never);
});
afterEach(() => vi.restoreAllMocks());

const item = (text: RegExp | string) => screen.getByText(text).closest('li')!;

describe('FriendsCard', () => {
  it('lists requests for you, requests you sent and friends', async () => {
    render(<FriendsCard />, { wrapper });
    expect(await screen.findByText('Lerato wants to connect')).toBeInTheDocument();
    expect(within(item(/thabo@tuks\.co\.za/)).getByText(/sent 14 Nov/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sam Moyo' })).toHaveAttribute('href', '/grove/f1');
  });

  it('declines, cancels and reloads the list after each', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue(undefined);
    const del = vi.spyOn(api, 'delete').mockResolvedValue(undefined);
    render(<FriendsCard />, { wrapper });

    await userEvent.click(await screen.findByRole('button', { name: "Decline Lerato's request" }));
    expect(post).toHaveBeenCalledWith('/friends/requests/in1/decline');

    await userEvent.click(
      screen.getByRole('button', { name: 'Cancel request to thabo@tuks.co.za' }),
    );
    expect(del).toHaveBeenCalledWith('/friends/requests/out1');
    expect(get.mock.calls.filter(([p]) => p === '/friends').length).toBeGreaterThanOrEqual(3);
  });

  it('asks before unfriending, and can keep the friend', async () => {
    const del = vi.spyOn(api, 'delete').mockResolvedValue(undefined);
    render(<FriendsCard />, { wrapper });

    await userEvent.click(await screen.findByRole('button', { name: 'Unfriend Sam Moyo' }));
    expect(screen.getByText('Remove Sam Moyo from your friends?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Keep' }));
    expect(del).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Unfriend Sam Moyo' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(del).toHaveBeenCalledWith('/friends/f1');
  });

  it('keeps the neutral message after sending, whether or not the email exists', async () => {
    vi.spyOn(api, 'post').mockResolvedValue({ ok: true });
    render(<FriendsCard />, { wrapper });
    await userEvent.type(screen.getByLabelText("Friend's email"), 'nobody@tuks.co.za');
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
    expect(await screen.findByText(/if that email has an account/i)).toHaveAttribute(
      'role',
      'status',
    );
  });

  it('shows the slow-down message when the server refuses with 429', async () => {
    vi.spyOn(api, 'post').mockRejectedValue(
      new ApiRequestError(429, 'Slow down a little and try again later'),
    );
    render(<FriendsCard />, { wrapper });
    await userEvent.type(screen.getByLabelText("Friend's email"), 'eleven@tuks.co.za');
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Slow down a little and try again later',
    );
  });
});

describe('FriendsCard invite link', () => {
  it('shows the link and copies it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<FriendsCard />, { wrapper });

    const input = await screen.findByDisplayValue(/\/add\/K7Q2XMAB$/);
    await userEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    expect(writeText).toHaveBeenCalledWith((input as HTMLInputElement).value);
    expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument();
  });

  it('asks before replacing the link, then shows the new one', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ code: 'NEWCODE2' });
    render(<FriendsCard />, { wrapper });
    await screen.findByDisplayValue(/K7Q2XMAB$/);

    await userEvent.click(screen.getByRole('button', { name: /make a new link/i }));
    expect(screen.getByText(/old link will stop working/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Make new link' }));

    expect(post).toHaveBeenCalledWith('/invites/mine/reset', {}, expect.anything());
    expect(await screen.findByDisplayValue(/NEWCODE2$/)).toBeInTheDocument();
  });
});
