import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../api/client';
import { useCheersSeenStore } from '../../stores/cheersStore';
import { CheersCard } from './CheersCard';

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const base = { fromId: 'sam', toId: 'me', fromName: 'Sam Moyo', toName: 'Me', moduleId: null };

beforeEach(() => useCheersSeenStore.setState({ seen: { me: '2026-11-14T12:00:00.000Z' } }));
afterEach(() => vi.restoreAllMocks());

describe('CheersCard', () => {
  it('lists cheers for you, tags new ones and marks them seen', async () => {
    vi.spyOn(api, 'get').mockResolvedValue([
      { ...base, id: 'c3', message: 'Go you!', moduleId: 6, createdAt: '2026-11-15T10:00:00.000Z' },
      {
        ...base,
        id: 'c2',
        fromId: 'me',
        toId: 'sam',
        message: null,
        createdAt: '2026-11-15T09:00:00.000Z',
      },
      { ...base, id: 'c1', message: null, createdAt: '2026-11-14T08:00:00.000Z' },
    ]);
    render(<CheersCard userId="me" />, { wrapper });

    const items = await screen.findAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Sam Moyo cheered you on Module 6New');
    expect(items[0]).toHaveTextContent('“Go you!”');
    expect(items[1]).not.toHaveTextContent('New');
    expect(useCheersSeenStore.getState().seen.me).toBe('2026-11-15T10:00:00.000Z');
  });

  it('says when there are no cheers yet', async () => {
    vi.spyOn(api, 'get').mockResolvedValue([]);
    render(<CheersCard userId="me" />, { wrapper });
    expect(await screen.findByText(/no cheers yet/i)).toBeInTheDocument();
  });
});
