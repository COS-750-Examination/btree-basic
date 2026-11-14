import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProgressStore } from '../../stores/progressStore';
import { RewardToast, TOAST_MS } from './RewardToast';

beforeEach(() => useProgressStore.setState({ lastBonus: null }));
afterEach(() => vi.useRealTimers());

describe('RewardToast', () => {
  it('announces a bonus and closes on request', async () => {
    render(<RewardToast />);
    act(() => useProgressStore.setState({ lastBonus: { reason: 'streak', amount: 15, at: 1 } }));

    expect(screen.getByRole('status')).toHaveTextContent('+15 leaves: 3-day practice streak!');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('closes by itself after a few seconds', () => {
    vi.useFakeTimers();
    render(<RewardToast />);
    act(() =>
      useProgressStore.setState({ lastBonus: { reason: 'readyCheck', amount: 60, at: 1 } }),
    );
    expect(screen.getByRole('status')).toHaveTextContent("You're ready for the lecture!");

    act(() => vi.advanceTimersByTime(TOAST_MS));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
});
