import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api/client';
import { useProgressStore } from './progressStore';

const correct = { itemId: 'm5-q2', objective: 'O3' as const, firstAttempt: true, hintsUsed: 0 };

beforeEach(() => {
  useProgressStore.getState().reset();
  useProgressStore.getState().setSignedIn(false);
  vi.restoreAllMocks();
});

describe('progress store leaves', () => {
  it('pays leaves only for the first correct answer to a question', () => {
    const { recordAttempt } = useProgressStore.getState();
    recordAttempt({ ...correct, correct: true });
    recordAttempt({ ...correct, correct: true });
    expect(useProgressStore.getState().leaves).toBe(10);
    expect(useProgressStore.getState().attempts).toHaveLength(2);
  });

  it('pays the first correct answer even after a wrong one', () => {
    const { recordAttempt } = useProgressStore.getState();
    recordAttempt({ ...correct, correct: false });
    recordAttempt({ ...correct, correct: true, firstAttempt: false });
    expect(useProgressStore.getState().leaves).toBe(5);
  });

  it('pays for reading a hint once per question and hint', () => {
    const { readHint } = useProgressStore.getState();
    readHint('m5-q2', 1);
    readHint('m5-q2', 1);
    readHint('m5-q2', 2);
    expect(useProgressStore.getState().leaves).toBe(10);
  });

  it('sends the question and hint number to the API when signed in', () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ ok: true });
    useProgressStore.getState().setSignedIn(true);
    useProgressStore.getState().readHint('m5-q2', 2);
    expect(post).toHaveBeenCalledWith('/hints', { itemId: 'm5-q2', hint: 2 });
  });
});
