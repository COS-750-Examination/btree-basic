import { describe, expect, it } from 'vitest';
import {
  DAILY_BROKEN,
  DAILY_VALID,
  VALID_REASON,
  buildTree,
  createTree,
  dailyAnswerTally,
  fromSpec,
  isValidBTree,
  pathRound,
  randomKeys,
  searchPath,
  toSpec,
  validItem,
  validKinds,
  validRound,
  type ValidKind,
} from '../src';

const keys10 = [40, 20, 60, 10, 30, 50, 70, 25, 55, 65];

describe('isValidBTree', () => {
  it('passes a tree built by insertion and fails broken ones', () => {
    expect(isValidBTree(buildTree(createTree(3), keys10), 3)).toBe(true);
    expect(
      isValidBTree(fromSpec(3, { keys: [20], children: [{ keys: [30] }, { keys: [25] }] }), 3),
    ).toBe(false);
    expect(isValidBTree(fromSpec(3, { keys: [9, 4] }), 3)).toBe(false);
    expect(isValidBTree(fromSpec(3, { keys: [1, 2, 3] }), 3)).toBe(false);
  });
});

describe('searchPath', () => {
  const tree = buildTree(createTree(3), keys10);

  it('stops at the node holding a key that is present', () => {
    const path = searchPath(tree, 55);
    const end = path.at(-1)!;
    const find = (id: string, n = tree.root!): typeof n | undefined =>
      n.id === id ? n : n.children.map((c) => find(id, c)).find(Boolean);
    expect(find(end)!.keys).toContain(55);
    expect(path[0]).toBe(tree.root!.id);
  });

  it('ends at the leaf where a missing key would go', () => {
    const path = searchPath(tree, 57);
    const find = (id: string, n = tree.root!): typeof n | undefined =>
      n.id === id ? n : n.children.map((c) => find(id, c)).find(Boolean);
    const leaf = find(path.at(-1)!)!;
    expect(leaf.children).toEqual([]);
    expect(leaf.keys.some((k) => k > 50 && k < 70)).toBe(true);
  });
});

describe('pathRound', () => {
  it('picks the same three searches for the same seed', () => {
    expect(pathRound(keys10, 42).searches).toEqual(pathRound(keys10, 42).searches);
  });

  it('searches a leaf key, a missing key inside the range, then a different leaf key', () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      const keys = randomKeys(10, seed * 7);
      const { tree, searches, moves } = pathRound(keys, seed);
      const [first, missing, third] = searches;
      expect(first!.present).toBe(true);
      expect(third!.present).toBe(true);
      expect(third!.target).not.toBe(first!.target);
      expect(missing!.present).toBe(false);
      expect(missing!.target).toBeGreaterThan(Math.min(...keys));
      expect(missing!.target).toBeLessThan(Math.max(...keys));
      for (const s of searches) expect(s.path).toEqual(searchPath(tree, s.target));
      expect(moves).toHaveLength(searches.reduce((n, s) => n + s.path.length - 1, 0));
      for (const m of moves) {
        const path = searches[m.searchIndex]!.path;
        expect(path.indexOf(m.answer)).toBe(path.indexOf(m.at) + 1);
      }
    }
  });
});

describe('validRound', () => {
  const keySets = [
    [12, 45, 7, 33, 81, 60],
    [5, 18, 27, 90, 64, 41],
    [3, 70, 52, 16, 38, 95],
    [22, 8, 77, 49, 61, 30],
  ];

  it('uses one tree of each kind in a seeded order', () => {
    expect(validKinds(9)).toEqual(validKinds(9));
    expect([...validKinds(9)].sort()).toEqual(['overfull', 'swap', 'unsorted', 'valid']);
    const seeds = new Set(Array.from({ length: 20 }, (_, i) => validKinds(i).join()));
    expect(seeds.size).toBeGreaterThan(1);
    expect(validRound(keySets, 9).map((t) => toSpec(t.tree))).toEqual(
      validRound(keySets, 9).map((t) => toSpec(t.tree)),
    );
  });

  it('makes every broken tree invalid and leaves the valid one valid', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const sets = [0, 1, 2, 3].map((i) => randomKeys(6, seed * 13 + i));
      for (const item of validRound(sets, seed)) {
        expect(isValidBTree(item.tree, 3)).toBe(item.valid);
        expect(item.answer).toBe(item.valid ? DAILY_VALID : DAILY_BROKEN);
        if (!item.valid) expect(item.problemNodeId).not.toBeNull();
      }
    }
  });

  it('writes the reason for each kind of break', () => {
    const swap = validItem([20, 10, 30, 5, 25], 'swap');
    expect(swap.reason).toMatch(/sits on the left of 20, but it's bigger than 20/);

    const over = validItem([10, 30, 50, 60], 'overfull');
    expect(over.reason).toBe(
      'The node holding 50, 55, 60 has 3 keys. In an order-3 tree a node holds at most 2.',
    );

    const unsorted = validItem([10, 20, 30, 40], 'unsorted');
    expect(unsorted.reason).toMatch(/^\d+ comes before \d+ in one node\./);
    const leaf = unsorted.tree.root!.children.find((c) => c.keys.length === 2)!;
    expect(leaf.keys[0]).toBeGreaterThan(leaf.keys[1]!);
  });

  it('falls back to a valid tree when a break cannot be applied', () => {
    const item = validItem([10, 11, 12], 'overfull' as ValidKind);
    expect(item).toMatchObject({ kind: 'valid', valid: true, reason: VALID_REASON });
  });
});

describe('dailyAnswerTally', () => {
  const moves = [{ answer: 'valid' }, { answer: 'broken' }];

  it('allows one answer per tree and counts wrong ones', () => {
    expect(
      dailyAnswerTally(moves, [
        { tries: ['valid'], hint: false },
        { tries: ['valid'], hint: false },
      ]),
    ).toEqual({ mistakes: 1, hints: 0, complete: true });
    expect(dailyAnswerTally(moves, [{ tries: ['valid'], hint: false }]).complete).toBe(false);
    expect(
      dailyAnswerTally(moves, [
        { tries: ['broken', 'valid'], hint: false },
        { tries: ['broken'], hint: false },
      ]).complete,
    ).toBe(false);
  });
});
