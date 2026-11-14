import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from '../../api/client';
import { useProgressStore } from '../../stores/progressStore';
import { useSyncStore } from '../../stores/syncStore';
import { ErrorBoundary } from './ErrorBoundary';
import { OfflineBanner } from './OfflineBanner';

const setOnline = (online: boolean) => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online);
  act(() => {
    window.dispatchEvent(new Event(online ? 'online' : 'offline'));
  });
};

beforeEach(() => {
  useSyncStore.getState().clear();
  useProgressStore.getState().setSignedIn(true);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

describe('OfflineBanner', () => {
  it('shows nothing while online with everything saved', () => {
    render(<OfflineBanner />, { wrapper: MemoryRouter });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('tells a signed-in student their progress will save when they reconnect', () => {
    render(<OfflineBanner />, { wrapper: MemoryRouter });
    setOnline(false);
    expect(screen.getByRole('status')).toHaveTextContent(/you're offline/i);
    expect(screen.getByRole('status')).toHaveTextContent(/will save when you reconnect/i);
  });

  it('counts unsaved changes and sends them again on "Try again"', async () => {
    let up = false;
    const call = vi.fn(() => (up ? Promise.resolve() : Promise.reject(new TypeError('offline'))));
    render(<OfflineBanner />, { wrapper: MemoryRouter });
    await act(async () => {
      useSyncStore.getState().save(call);
      await Promise.resolve();
    });
    expect(screen.getByRole('status')).toHaveTextContent(/one change .* hasn't saved yet/i);

    up = true;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
});

describe('OfflineBanner when the session expired', () => {
  it('offers to sign in again', async () => {
    render(<OfflineBanner />, { wrapper: MemoryRouter });
    await act(async () => {
      useSyncStore.getState().save(() => Promise.reject(new ApiRequestError(401, 'Sign in')));
      await Promise.resolve();
    });
    expect(screen.getByRole('status')).toHaveTextContent(/you've been signed out/i);
    const link = screen.getByRole('link', { name: 'Sign in again' });
    expect(link).toHaveAttribute('href', '/login');

    await userEvent.click(link);
    expect(useSyncStore.getState().rejected).toBeNull();
  });
});

describe('ErrorBoundary', () => {
  function Broken(): never {
    throw new Error('boom');
  }

  it('shows a friendly card instead of a blank page', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/this branch snapped/i);
    expect(screen.getByRole('button', { name: 'Reload the page' })).toBeInTheDocument();
  });

  it('explains a page that failed to download as a connection problem', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    function Offline(): never {
      throw new TypeError('Failed to fetch dynamically imported module: /src/pages/QuizPage.tsx');
    }
    render(
      <ErrorBoundary>
        <Offline />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/check your internet connection/i);
  });
});
