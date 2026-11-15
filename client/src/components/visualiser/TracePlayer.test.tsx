import { fromSpec, insert } from '@btree/engine';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TracePlayer } from './TracePlayer';

const speech = vi.hoisted(() => ({
  ends: [] as (() => void)[],
  spoken: [] as string[],
}));

vi.mock('../../lib/speech', () => ({
  speechSupported: () => true,
  speechEstimateMs: () => 20_000,
  stopSpeaking: vi.fn(),
  speak: (text: string, _rate: number, onEnd?: () => void) => {
    speech.spoken.push(text);
    if (onEnd) speech.ends.push(onEnd);
  },
}));

const trace = insert(fromSpec(3, { keys: [20] }), 10);
const stepNumber = () =>
  Number(/Step (\d+) of/.exec(screen.getByRole('img').getAttribute('aria-label') ?? '')?.[1]);

beforeEach(() => {
  vi.useFakeTimers();
  speech.ends.length = 0;
  speech.spoken.length = 0;
});

afterEach(() => vi.useRealTimers());

const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe('TracePlayer playback', () => {
  it('waits for the narration to finish, then moves on after a short pause', () => {
    render(<TracePlayer trace={trace} />);
    fireEvent.click(screen.getByRole('button', { name: 'Read steps aloud' }));
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));

    wait(10_000);
    expect(stepNumber()).toBe(1);

    act(() => speech.ends.at(-1)!());
    wait(349);
    expect(stepNumber()).toBe(1);
    wait(1);
    expect(stepNumber()).toBe(2);
    expect(speech.spoken.at(-1)).not.toBe(speech.spoken[0]);
  });

  it('moves on anyway if the browser never says the sentence ended', () => {
    render(<TracePlayer trace={trace} />);
    fireEvent.click(screen.getByRole('button', { name: 'Read steps aloud' }));
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));

    wait(19_999);
    expect(stepNumber()).toBe(1);
    wait(1);
    wait(350);
    expect(stepNumber()).toBe(2);
  });

  it('keeps the normal timing when the voice is off', () => {
    render(<TracePlayer trace={trace} />);
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));

    wait(1399);
    expect(stepNumber()).toBe(1);
    wait(1);
    expect(stepNumber()).toBe(2);
    expect(speech.spoken).toEqual([]);
  });
});
