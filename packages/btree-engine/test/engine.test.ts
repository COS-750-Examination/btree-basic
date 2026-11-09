import { describe, expect, it } from 'vitest';
import {
  buildTree,
  createTree,
  fromSpec,
  height,
  inOrderKeys,
  insert,
  remove,
  search,
  toSpec,
  validate,
} from '../src';

/** The order-3 tree used throughout the mockups: [20] over [8 12] and [28 30]. */
const mockupTree = () =>
  fromSpec(3, { keys: [20], children: [{ keys: [8, 12] }, { keys: [28, 30] }] });

describe('search', () => {
  it('finds a key and reports the path', () => {
    const trace = search(mockupTree(), 28);
    expect(trace.steps.at(-1)?.kind).toBe('found');
    expect(trace.steps.filter((s) => s.kind === 'visit')).toHaveLength(2);
  });

  it('reports not-found at a leaf', () => {
    const trace = search(mockupTree(), 25);
    expect(trace.steps.at(-1)?.kind).toBe('not-found');
  });

  it('handles an empty tree', () => {
    expect(search(createTree(3), 1).steps.at(-1)?.narration).toBe('empty-tree');
  });

  it('does not change the tree', () => {
    const tree = mockupTree();
    expect(search(tree, 12).result).toEqual(tree);
  });
});

describe('insert', () => {
  it('splits an overflowing order-3 leaf and promotes the median (mockup: insert 25)', () => {
    const trace = insert(mockupTree(), 25);
    expect(toSpec(trace.result)).toEqual({
      keys: [20, 28],
      children: [{ keys: [8, 12] }, { keys: [25] }, { keys: [30] }],
    });
    const overflow = trace.steps.find((s) => s.kind === 'overflow');
    expect(overflow?.params.median).toBe(28);
    expect(trace.steps.some((s) => s.kind === 'promote')).toBe(true);
  });

  it('grows the tree at the root when splits cascade', () => {
    const start = fromSpec(3, {
      keys: [20, 40],
      children: [{ keys: [10] }, { keys: [30] }, { keys: [50, 60] }],
    });
    const trace = insert(start, 70);
    expect(height(start)).toBe(2);
    expect(height(trace.result)).toBe(3);
    expect(trace.steps.some((s) => s.kind === 'new-root')).toBe(true);
    expect(toSpec(trace.result)?.keys).toEqual([40]);
  });

  it('places a key without splitting when the leaf has room', () => {
    const trace = insert(
      fromSpec(3, { keys: [20], children: [{ keys: [8] }, { keys: [30] }] }),
      25,
    );
    expect(trace.steps.some((s) => s.kind === 'split')).toBe(false);
    expect(toSpec(trace.result)?.children?.[1]?.keys).toEqual([25, 30]);
  });

  it('rejects duplicates without changing the tree', () => {
    const tree = mockupTree();
    const trace = insert(tree, 12);
    expect(trace.steps.at(-1)?.kind).toBe('duplicate');
    expect(trace.result).toEqual(tree);
  });

  it('matches the classic order-5 sequence', () => {
    const tree = buildTree(
      createTree(5),
      [1, 12, 8, 2, 25, 6, 14, 28, 17, 7, 52, 16, 48, 68, 3, 26, 29, 53, 55, 45],
    );
    expect(validate(tree).valid).toBe(true);
    expect(inOrderKeys(tree)).toEqual([
      1, 2, 3, 6, 7, 8, 12, 14, 16, 17, 25, 26, 28, 29, 45, 48, 52, 53, 55, 68,
    ]);
  });

  it('every snapshot is independent of later steps', () => {
    const trace = insert(mockupTree(), 25);
    const firstSnapshot = JSON.stringify(trace.steps[0]!.tree);
    expect(firstSnapshot).toBe(JSON.stringify(mockupTree()));
  });
});

describe('delete', () => {
  it('removes a key from a leaf that stays valid', () => {
    const trace = remove(mockupTree(), 12);
    expect(toSpec(trace.result)).toEqual({
      keys: [20],
      children: [{ keys: [8] }, { keys: [28, 30] }],
    });
  });

  it('borrows from a sibling through the parent', () => {
    const tree = fromSpec(3, { keys: [20], children: [{ keys: [8] }, { keys: [28, 30] }] });
    const trace = remove(tree, 8);
    expect(trace.steps.some((s) => s.kind === 'borrow-right')).toBe(true);
    expect(toSpec(trace.result)).toEqual({
      keys: [28],
      children: [{ keys: [20] }, { keys: [30] }],
    });
  });

  it('merges and shrinks the root', () => {
    const tree = fromSpec(3, { keys: [20], children: [{ keys: [8] }, { keys: [30] }] });
    const trace = remove(tree, 8);
    expect(trace.steps.some((s) => s.kind === 'merge')).toBe(true);
    expect(trace.steps.some((s) => s.kind === 'shrink-root')).toBe(true);
    expect(toSpec(trace.result)).toEqual({ keys: [20, 30] });
  });

  it('replaces an internal key with its predecessor', () => {
    const trace = remove(mockupTree(), 20);
    expect(trace.steps.some((s) => s.kind === 'replace-predecessor')).toBe(true);
    expect(toSpec(trace.result)?.keys).toEqual([12]);
  });

  it('reports a missing key', () => {
    expect(remove(mockupTree(), 99).steps.at(-1)?.narration).toBe('delete-not-found');
  });
});

describe('validate', () => {
  it('flags each broken rule', () => {
    const tooFull = fromSpec(3, { keys: [1, 2, 3] });
    expect(validate(tooFull).violations.map((v) => v.rule)).toContain('max-keys');

    const unevenLeaves = fromSpec(3, {
      keys: [20],
      children: [{ keys: [10] }, { keys: [30], children: [{ keys: [25] }, { keys: [35] }] }],
    });
    expect(validate(unevenLeaves).violations.map((v) => v.rule)).toContain('leaf-depth');

    const wrongSide = fromSpec(3, { keys: [20], children: [{ keys: [25] }, { keys: [30] }] });
    expect(validate(wrongSide).violations.map((v) => v.rule)).toContain('key-ranges');
  });
});
