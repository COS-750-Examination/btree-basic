import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

function renderAt(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  // No API in unit tests: the app must still work (NFR7).
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new Error('offline'))),
  );
  sessionStorage.clear();
});

describe('App', () => {
  it('renders the welcome screen', () => {
    renderAt('/');
    expect(
      screen.getByRole('heading', { level: 1, name: /learn b-trees one branch at a time/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /start the 2-minute warm-up/i })).toHaveAttribute(
      'href',
      '/warm-up',
    );
  });

  it('runs an insert in the visualiser without the API', async () => {
    renderAt('/visualiser');
    await userEvent.click(await screen.findByRole('button', { name: 'Insert' }));
    expect(screen.getByText(/Inserting 25/)).toBeInTheDocument();
    expect(screen.getByText(/Step 1 of/)).toBeInTheDocument();
  });

  it('locks modules that are not reached yet', async () => {
    renderAt('/lessons');
    expect((await screen.findAllByText('Locked')).length).toBeGreaterThan(0);
  });
});
