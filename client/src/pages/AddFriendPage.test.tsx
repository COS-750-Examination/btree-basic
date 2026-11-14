import type { InvitePreview } from '@btree/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError, api } from '../api/client';
import { AddFriendPage } from './AddFriendPage';

const signedIn = { user: { id: 'me', displayName: 'Me', email: 'me@x.za', theme: null } };

function mockGet(session: unknown, preview: InvitePreview | Error) {
  vi.spyOn(api, 'get').mockImplementation(((path: string) =>
    path === '/auth/session'
      ? Promise.resolve(session)
      : preview instanceof Error
        ? Promise.reject(preview)
        : Promise.resolve(preview)) as never);
}

function show() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/add/k7q2xmab']}>
        <Routes>
          <Route path="/add/:code" element={<AddFriendPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => vi.restoreAllMocks());

describe('AddFriendPage', () => {
  it('asks guests to sign in and brings them back to the invite', async () => {
    mockGet({ user: null }, { displayName: 'x', status: 'none', friendId: null });
    show();
    expect(await screen.findByRole('heading', { name: "You've been invited" })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login?next=%2Fadd%2FK7Q2XMAB',
    );
  });

  it('sends a request from the link', async () => {
    mockGet(signedIn, { displayName: 'Thabo Nkosi', status: 'none', friendId: null });
    const post = vi.spyOn(api, 'post').mockResolvedValue({ status: 'sent', friendId: null });
    show();

    await userEvent.click(await screen.findByRole('button', { name: 'Send friend request' }));
    expect(post).toHaveBeenCalledWith('/invites/K7Q2XMAB', {}, expect.anything());
    expect(await screen.findByRole('heading', { name: 'Request sent' })).toBeInTheDocument();
  });

  it('becomes friends at once when they had already asked', async () => {
    mockGet(signedIn, { displayName: 'Lerato', status: 'received', friendId: null });
    vi.spyOn(api, 'post').mockResolvedValue({ status: 'friends', friendId: 'f9' });
    show();

    await userEvent.click(await screen.findByRole('button', { name: 'Accept' }));
    expect(await screen.findByRole('heading', { name: "You're now friends!" })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Visit Lerato's grove" })).toHaveAttribute(
      'href',
      '/grove/f9',
    );
  });

  it('explains a link that no longer works', async () => {
    mockGet(signedIn, new ApiRequestError(404, 'Invite link not found'));
    show();
    expect(
      await screen.findByRole('heading', { name: "This link doesn't work" }),
    ).toBeInTheDocument();
  });

  it('recognises your own link', async () => {
    mockGet(signedIn, { displayName: 'Me', status: 'self', friendId: null });
    show();
    expect(
      await screen.findByRole('heading', { name: 'This is your own link' }),
    ).toBeInTheDocument();
  });

  it('shows the slow-down message when sending is refused', async () => {
    mockGet(signedIn, { displayName: 'Sam', status: 'none', friendId: null });
    vi.spyOn(api, 'post').mockRejectedValue(
      new ApiRequestError(429, 'Slow down a little and try again later'),
    );
    show();
    await userEvent.click(await screen.findByRole('button', { name: 'Send friend request' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Slow down');
  });
});
