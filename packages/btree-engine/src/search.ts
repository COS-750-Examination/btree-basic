import { Recorder } from './recorder';
import { childIndexFor, cloneTree, isLeaf } from './tree';
import type { BTree, BTreeNode, Trace } from './types';

/** Pseudocode lines for `search` (see pseudocode.ts). */
const L = { header: 1, compare: 2, found: 4, leaf: 5, notFound: 6, descend: 7 } as const;

export interface DescentResult {
  /** Nodes visited from the root down, ending at the node holding the key or at a leaf. */
  path: BTreeNode[];
  /** Child index taken at each internal node of `path` (length = path.length - 1). */
  childIndices: number[];
  /** Index of `key` in the last node, or -1 if not found. */
  foundAt: number;
}

/**
 * Walks from the root towards `key`, recording visit/compare/descend steps.
 * Shared by search, insert (find the leaf) and delete (find the key).
 */
export function descend(
  tree: BTree,
  key: number,
  rec: Recorder,
  lineOffset: { compare: number; descend: number },
  stopAtKey = true,
): DescentResult {
  const path: BTreeNode[] = [];
  const childIndices: number[] = [];
  let node = tree.root;
  while (node) {
    path.push(node);
    rec.record({
      kind: 'visit',
      phase: 'find',
      line: lineOffset.compare,
      nodeIds: [node.id],
      narration: 'visit',
      params: { key, keys: node.keys.join(', ') },
    });
    const i = childIndexFor(node, key);
    const hit = i < node.keys.length && node.keys[i] === key;
    rec.record({
      kind: 'compare',
      phase: 'find',
      line: lineOffset.compare,
      nodeIds: [node.id],
      keys: hit ? [key] : node.keys.slice(Math.max(0, i - 1), i + 1),
      narration: hit
        ? 'compare-equal'
        : isLeaf(node)
          ? 'compare-leaf'
          : i === 0
            ? 'compare-less'
            : i === node.keys.length
              ? 'compare-greater'
              : 'compare-between',
      params: {
        key,
        index: i,
        lower: i > 0 ? node.keys[i - 1]! : '',
        upper: i < node.keys.length ? node.keys[i]! : '',
      },
    });
    if (hit && stopAtKey) return { path, childIndices, foundAt: i };
    if (isLeaf(node)) return { path, childIndices, foundAt: hit ? i : -1 };
    childIndices.push(i);
    const child: BTreeNode = node.children[i]!;
    rec.record({
      kind: 'descend',
      phase: 'find',
      line: lineOffset.descend,
      nodeIds: [node.id, child.id],
      narration: 'descend',
      params: { key, index: i },
    });
    node = child;
  }
  return { path, childIndices, foundAt: -1 };
}

/** Searches for `key`. The tree is not modified. */
export function search(input: BTree, key: number): Trace {
  const tree = cloneTree(input);
  const rec = new Recorder(tree);
  rec.record({
    kind: 'start',
    phase: 'find',
    line: L.header,
    narration: 'search-start',
    params: { key },
  });

  if (!tree.root) {
    rec.record({
      kind: 'not-found',
      phase: 'finish',
      line: L.notFound,
      narration: 'empty-tree',
      params: { key },
    });
    return {
      operation: 'search',
      key,
      order: tree.order,
      initial: input,
      result: tree,
      steps: rec.steps,
    };
  }

  const { path, foundAt } = descend(tree, key, rec, { compare: L.compare, descend: L.descend });
  const last = path[path.length - 1]!;
  if (foundAt >= 0) {
    rec.record({
      kind: 'found',
      phase: 'finish',
      line: L.found,
      nodeIds: [last.id],
      keys: [key],
      narration: 'found',
      params: { key, depth: path.length },
    });
  } else {
    rec.record({
      kind: 'not-found',
      phase: 'finish',
      line: L.notFound,
      nodeIds: [last.id],
      narration: 'not-found',
      params: { key, depth: path.length },
    });
  }
  return {
    operation: 'search',
    key,
    order: tree.order,
    initial: input,
    result: tree,
    steps: rec.steps,
  };
}
