import { describe, expect, it } from 'vitest';
import { DAILY_NEXT, DAILY_ROOT, dailyMoves, dailyTally, toSpec } from '../src';

describe('dailyMoves', () => {
  it('builds the whole tree from the first key: place, then check', () => {
    const moves = dailyMoves([20, 8, 12, 28, 30]);
    expect(moves.map((m) => [m.kind, m.key, m.answer])).toEqual([
      ['place', 20, DAILY_ROOT],
      ['check', 20, DAILY_NEXT],
      ['place', 8, 'n1'],
      ['check', 8, DAILY_NEXT],
      ['place', 12, 'n1'],
      ['check', 12, 12],
      ['check', 12, DAILY_NEXT],
      ['place', 28, 'n2'],
      ['check', 28, DAILY_NEXT],
      ['place', 30, 'n2'],
      ['check', 30, 28],
      ['check', 30, DAILY_NEXT],
    ]);
  });

  it('shows the tree before placing and with the key in place when checking', () => {
    const [place, check] = dailyMoves([20, 8, 12]).slice(4);
    expect(toSpec(place!.tree)).toEqual({ keys: [8, 20] });
    expect(check).toMatchObject({ kind: 'check', nodeId: 'n1', answer: 12 });
    expect(toSpec(check!.tree)).toEqual({ keys: [8, 12, 20] });
  });

  it('asks for a split at each level of a cascade, then for Next key', () => {
    const checks = dailyMoves([10, 20, 30, 40, 50, 60, 70]).filter(
      (m) => m.kind === 'check' && m.key === 70,
    );
    expect(checks.map((m) => m.answer)).toEqual([60, 40, DAILY_NEXT]);
    expect(toSpec(checks[2]!.tree)).toEqual({
      keys: [40],
      children: [
        { keys: [20], children: [{ keys: [10] }, { keys: [30] }] },
        { keys: [60], children: [{ keys: [50] }, { keys: [70] }] },
      ],
    });
  });

  it('counts distinct wrong tries and hints, and needs every move solved', () => {
    const moves = dailyMoves([20, 8, 12, 28, 30]);
    const right = moves.map((m) => ({ tries: [m.answer], hint: false }));
    expect(dailyTally(moves, right)).toEqual({ mistakes: 0, hints: 0, complete: true });

    const messy = right.map((p, i) =>
      i === 5 ? { tries: [DAILY_NEXT, 8, 8, 12], hint: true } : p,
    );
    expect(dailyTally(moves, messy)).toEqual({ mistakes: 2, hints: 1, complete: true });

    expect(dailyTally(moves, right.slice(1)).complete).toBe(false);
    expect(dailyTally(moves, [{ tries: ['n9'], hint: false }, ...right.slice(1)]).complete).toBe(
      false,
    );
  });
});
