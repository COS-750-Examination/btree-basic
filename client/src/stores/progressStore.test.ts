import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api/client';
import { queryClient } from '../api/queryClient';
import { placedDecorations, useProgressStore } from './progressStore';

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

describe('progress store decorations', () => {
  const own = (...ids: string[]) =>
    useProgressStore.setState({ ownedDecorations: ids, hiddenDecorations: [] });

  it('puts a bought decoration straight onto the tree', () => {
    useProgressStore.setState({ leaves: 100 });
    useProgressStore.getState().buyDecoration('apples', 40);
    expect(placedDecorations(useProgressStore.getState())).toEqual(['apples']);
  });

  it('takes an owned decoration off the tree and puts it back', () => {
    own('apples', 'bunting');
    const { toggleDecoration } = useProgressStore.getState();

    toggleDecoration('bunting');
    expect(placedDecorations(useProgressStore.getState())).toEqual(['apples']);
    expect(useProgressStore.getState().ownedDecorations).toEqual(['apples', 'bunting']);

    toggleDecoration('bunting');
    expect(placedDecorations(useProgressStore.getState())).toEqual(['apples', 'bunting']);
  });

  it('ignores decorations the student does not own', () => {
    own('apples');
    useProgressStore.getState().toggleDecoration('songbird');
    expect(useProgressStore.getState().hiddenDecorations).toEqual([]);
  });

  it('saves the change to the server when signed in', () => {
    const put = vi.spyOn(api, 'put').mockResolvedValue(undefined);
    own('apples');
    useProgressStore.getState().setSignedIn(true);

    useProgressStore.getState().toggleDecoration('apples');
    expect(put).toHaveBeenLastCalledWith('/grove/placement', {
      items: [{ decorationId: 'apples', placed: false }],
    });

    useProgressStore.getState().toggleDecoration('apples');
    expect(put).toHaveBeenLastCalledWith('/grove/placement', {
      items: [{ decorationId: 'apples', placed: true }],
    });
  });

  it('moves a decoration, saves where it went, and moves it back', () => {
    const put = vi.spyOn(api, 'put').mockResolvedValue(undefined);
    own('apples');
    useProgressStore.getState().setSignedIn(true);

    useProgressStore.getState().moveDecoration('apples', { x: 40, y: -16 });
    expect(useProgressStore.getState().decorationPositions).toEqual({ apples: { x: 40, y: -16 } });
    expect(put).toHaveBeenLastCalledWith('/grove/placement', {
      items: [{ decorationId: 'apples', placed: true, x: 40, y: -16 }],
    });

    useProgressStore.getState().moveDecoration('apples', null);
    expect(useProgressStore.getState().decorationPositions).toEqual({});
    expect(put).toHaveBeenLastCalledWith('/grove/placement', {
      items: [{ decorationId: 'apples', placed: true, x: null, y: null }],
    });
  });

  it("keeps a guest's moves on this device only", () => {
    const put = vi.spyOn(api, 'put');
    own('apples');
    useProgressStore.getState().moveDecoration('apples', { x: 5, y: 5 });
    useProgressStore.getState().moveDecoration('songbird', { x: 5, y: 5 });
    expect(useProgressStore.getState().decorationPositions).toEqual({ apples: { x: 5, y: 5 } });
    expect(put).not.toHaveBeenCalled();
  });

  it('loads which owned decorations are off the tree on sign-in', async () => {
    vi.spyOn(api, 'get').mockImplementation((path: string) =>
      Promise.resolve(
        {
          '/progress': { modules: [] },
          '/attempts': [
            {
              itemId: 'm6-q1',
              objective: 'O5',
              correct: true,
              firstAttempt: true,
              hintsUsed: 0,
              at: '2026-11-14T10:00:00.000Z',
            },
          ],
          '/leaves': { balance: 0 },
          '/lecture-questions': [],
          '/decorations': [
            { id: 'apples', owned: true, placed: true, x: 12, y: -8 },
            { id: 'bunting', owned: true, placed: false, x: null, y: null },
            { id: 'songbird', owned: false, placed: false, x: null, y: null },
          ],
        }[path],
      ),
    );

    await useProgressStore.getState().hydrateFromServer();

    expect(useProgressStore.getState().ownedDecorations).toEqual(['apples', 'bunting']);
    expect(placedDecorations(useProgressStore.getState())).toEqual(['apples']);
    expect(useProgressStore.getState().decorationPositions).toEqual({ apples: { x: 12, y: -8 } });
    // Past answers come back too, so the header's readiness matches the server after sign-in.
    expect(useProgressStore.getState().attempts).toEqual([
      expect.objectContaining({ itemId: 'm6-q1', objective: 'O5', correct: true }),
    ]);
    // An answer that already paid leaves on another device doesn't pay again here.
    const before = useProgressStore.getState().leaves;
    useProgressStore.getState().recordAttempt({
      itemId: 'm6-q1',
      objective: 'O5',
      correct: true,
      firstAttempt: true,
      hintsUsed: 0,
    });
    expect(useProgressStore.getState().leaves).toBe(before);
  });
});

describe('progress store server bonuses', () => {
  const flush = () => new Promise((r) => setTimeout(r, 0));
  const reply = (bonuses: { reason: 'streak' | 'readyCheck'; amount: number }[]) => ({
    objective: 'O3',
    score: 1,
    counted: 1,
    status: 'getting-there',
    bonuses,
  });

  it('adds a ready-check bonus from the server to leaves and the ledger', async () => {
    vi.spyOn(api, 'post').mockResolvedValue(reply([{ reason: 'readyCheck', amount: 60 }]));
    useProgressStore.getState().setSignedIn(true);

    useProgressStore.getState().recordAttempt({ ...correct, correct: true });
    await flush();

    const s = useProgressStore.getState();
    expect(s.leaves).toBe(10 + 60);
    expect(s.ledger[0]).toMatchObject({ amount: 60, reason: 'readyCheck' });
    expect(s.lastBonus).toMatchObject({ amount: 60, reason: 'readyCheck' });
  });

  it('adds nothing when the server pays no bonus', async () => {
    vi.spyOn(api, 'post').mockResolvedValue(reply([]));
    useProgressStore.getState().setSignedIn(true);

    useProgressStore.getState().recordAttempt({ ...correct, correct: true });
    await flush();

    expect(useProgressStore.getState().leaves).toBe(10);
    expect(useProgressStore.getState().lastBonus).toBeNull();
  });

  it('never gives guests a bonus, because nothing is sent to the server', async () => {
    const post = vi.spyOn(api, 'post');
    useProgressStore.getState().recordAttempt({ ...correct, correct: true });
    await flush();

    expect(post).not.toHaveBeenCalled();
    expect(useProgressStore.getState().leaves).toBe(10);
  });
});

describe('progress store badge refresh', () => {
  const flush = () => new Promise((r) => setTimeout(r, 0));
  const refreshedBadges = (spy: { mock: { calls: unknown[][] } }) =>
    spy.mock.calls.some(([f]) => JSON.stringify(f) === JSON.stringify({ queryKey: ['badges'] }));

  beforeEach(() => useProgressStore.getState().setSignedIn(true));

  it('reloads badges after an answer is saved', async () => {
    vi.spyOn(api, 'post').mockResolvedValue({
      objective: 'O3',
      score: 1,
      counted: 1,
      status: 'getting-there',
      bonuses: [],
    });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    useProgressStore.getState().recordAttempt({ ...correct, correct: true });
    await flush();
    expect(refreshedBadges(invalidate)).toBe(true);
  });

  it('reloads badges after a module and the warm-up are saved', async () => {
    vi.spyOn(api, 'put').mockResolvedValue({});
    vi.spyOn(api, 'post').mockResolvedValue({});
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    useProgressStore.getState().completeModule(1);
    await flush();
    expect(refreshedBadges(invalidate)).toBe(true);

    invalidate.mockClear();
    useProgressStore.getState().finishWarmup(3, 5, []);
    await flush();
    expect(refreshedBadges(invalidate)).toBe(true);
  });

  it('does not reload badges when the save failed', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(api, 'put').mockRejectedValue(new TypeError('offline'));
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    useProgressStore.getState().completeModule(1);
    await flush();
    expect(refreshedBadges(invalidate)).toBe(false);
  });
});
