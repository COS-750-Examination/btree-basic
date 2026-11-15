import { describe, expect, it } from 'vitest';
import { DAILY_NEXT, dailyMoves, dailyTally, toSpec } from '../src';

describe('dailyMoves', () => {
  it('starts with the first key in the root, with a split step when a node overflows', () => {
    const moves = dailyMoves([20, 8, 12, 28, 30]);
    expect(moves.map((m) => [m.kind, m.key, m.answer])).toEqual([
      ['place', 8, 'n1'],
      ['place', 12, 'n1'],
      ['check', 12, 12],
      ['place', 28, 'n2'],
      ['place', 30, 'n2'],
      ['check', 30, 28],
    ]);
  });

  it('shows the tree before placing and with the key in place when splitting', () => {
    const [place, check] = dailyMoves([20, 8, 12]).slice(1);
    expect(toSpec(place!.tree)).toEqual({ keys: [8, 20] });
    expect(check).toMatchObject({ kind: 'check', nodeId: 'n1', answer: 12 });
    expect(toSpec(check!.tree)).toEqual({ keys: [8, 12, 20] });
  });

  it('asks for a split at each level of a cascade', () => {
    const checks = dailyMoves([10, 20, 30, 40, 50, 60, 70]).filter(
      (m) => m.kind === 'check' && m.key === 70,
    );
    expect(checks.map((m) => m.answer)).toEqual([60, 40]);
    expect(toSpec(checks[1]!.tree)).toEqual({
      keys: [20, 40, 60],
      children: [{ keys: [10] }, { keys: [30] }, { keys: [50] }, { keys: [70] }],
    });
  });

  it('counts distinct wrong tries and hints, and needs every move solved', () => {
    const moves = dailyMoves([20, 8, 12, 28, 30]);
    const right = moves.map((m) => ({ tries: [m.answer], hint: false }));
    expect(dailyTally(moves, right)).toEqual({ mistakes: 0, hints: 0, complete: true });

    const messy = right.map((p, i) =>
      i === 2 ? { tries: [DAILY_NEXT, 8, 8, 12], hint: true } : p,
    );
    expect(dailyTally(moves, messy)).toEqual({ mistakes: 2, hints: 1, complete: true });

    expect(dailyTally(moves, right.slice(1)).complete).toBe(false);
    expect(dailyTally(moves, [{ tries: ['n9'], hint: false }, ...right.slice(1)]).complete).toBe(
      false,
    );
  });
});
