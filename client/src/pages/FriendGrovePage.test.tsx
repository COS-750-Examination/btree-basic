import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError, api } from '../api/client';
import { FriendGrovePage } from './FriendGrovePage';

afterEach(() => vi.restoreAllMocks());

describe('FriendGrovePage', () => {
  it('says you are no longer friends instead of showing a broken page', async () => {
    vi.spyOn(api, 'get').mockImplementation(((path: string) =>
      path === '/auth/session'
        ? Promise.resolve({ user: { id: 'me', displayName: 'Me', email: 'me@x.za' } })
        : path === '/cheers'
          ? Promise.resolve([])
          : Promise.reject(new ApiRequestError(404, 'Not found'))) as never);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/grove/gone']}>
          <Routes>
            <Route path="/grove/:friendId" element={<FriendGrovePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(
      await screen.findByRole('heading', { name: /you're no longer friends/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← My grove' })).toHaveAttribute('href', '/grove');
  });
});
