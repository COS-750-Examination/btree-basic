import type { Badge } from '@btree/shared';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LOCKED_BADGES } from '../../lib/badges';
import { BadgeCard } from './BadgeCard';

const useBadges = vi.fn();
vi.mock('../../api/hooks', () => ({ useBadges: (enabled: boolean) => useBadges(enabled) }));

const list: Badge[] = LOCKED_BADGES.map((b) =>
  b.id === 'explorer' ? { ...b, awardedAt: '2026-11-14T08:00:00.000Z' } : b,
);

const tile = (label: string) => screen.getByText(label).closest('li')!;

beforeEach(() => useBadges.mockReset());

describe('BadgeCard', () => {
  it('shows earned badges with the date and locked ones as locked', () => {
    useBadges.mockReturnValue({ data: list, isSuccess: true, isError: false });
    render(<BadgeCard signedIn />, { wrapper: MemoryRouter });

    expect(screen.getByText('1 of 4 earned')).toBeInTheDocument();
    expect(within(tile('Explorer')).getByText(/earned 14 nov 2026/i)).toBeInTheDocument();
    for (const label of ['Splitter', 'Root Raiser', 'Lecture Ready']) {
      expect(within(tile(label)).getByText('Locked')).toBeInTheDocument();
    }
    // The description says how to earn each one.
    expect(screen.getByText(/split an overflowing node correctly 3 times/i)).toBeInTheDocument();
  });

  it('shows guests all four badges locked and asks them to sign in', () => {
    useBadges.mockReturnValue({ data: undefined, isSuccess: false, isError: false });
    render(<BadgeCard signedIn={false} />, { wrapper: MemoryRouter });

    expect(useBadges).toHaveBeenCalledWith(false);
    expect(screen.getAllByText('Locked')).toHaveLength(4);
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
  });

  it('says so when the badges cannot load', () => {
    useBadges.mockReturnValue({ data: undefined, isSuccess: false, isError: true });
    render(<BadgeCard signedIn />, { wrapper: MemoryRouter });
    expect(screen.getByText(/couldn't load/i)).toBeInTheDocument();
  });
});
