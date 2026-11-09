import { Recorder } from './recorder';
import { descend } from './search';
import { childIndexFor, cloneTree, isLeaf, maxKeys, medianIndex, newNode } from './tree';
import type { BTree, BTreeNode, Trace } from './types';

/** Pseudocode lines for `insert` (see pseudocode.ts). */
const L = {
  header: 1,
  findLeaf: 2,
  addInOrder: 3,
  overflowCheck: 5,
  middleKey: 6,
  split: 7,
  newRoot: 8,
  parentAdd: 9,
  moveUp: 10,
} as const;

/**
 * Bottom-up insertion: the key always goes into a leaf; an overflowing node (m keys)
 * splits around its median, which moves up to the parent. Splits may cascade, and a
 * root split grows the tree by one level. Duplicate keys are rejected (no change).
 */
export function insert(input: BTree, key: number): Trace {
  const tree = cloneTree(input);
  const rec = new Recorder(tree);
  const done = (): Trace => ({
    operation: 'insert',
    key,
    order: tree.order,
    initial: input,
    result: tree,
    steps: rec.steps,
  });

  rec.record({
    kind: 'start',
    phase: 'find',
    line: L.header,
    narration: 'insert-start',
    params: { key },
  });

  if (!tree.root) {
    tree.root = newNode(tree, [key]);
    rec.record({
      kind: 'create-root',
      phase: 'place',
      line: L.addInOrder,
      nodeIds: [tree.root.id],
      keys: [key],
      narration: 'create-root',
      params: { key },
    });
    rec.record({
      kind: 'done',
      phase: 'finish',
      line: L.header,
      narration: 'insert-done',
      params: { key },
    });
    return done();
  }

  const { path, childIndices, foundAt } = descend(tree, key, rec, {
    compare: L.findLeaf,
    descend: L.findLeaf,
  });
  const leaf = path[path.length - 1]!;

  if (foundAt >= 0) {
    rec.record({
      kind: 'duplicate',
      phase: 'finish',
      line: L.findLeaf,
      nodeIds: [leaf.id],
      keys: [key],
      narration: 'duplicate',
      params: { key },
    });
    return done();
  }

  leaf.keys.splice(childIndexFor(leaf, key), 0, key);
  rec.record({
    kind: 'insert-key',
    phase: 'place',
    line: L.addInOrder,
    nodeIds: [leaf.id],
    keys: [key],
    narration: leaf.keys.length > maxKeys(tree.order) ? 'insert-key-full' : 'insert-key',
    params: { key, size: leaf.keys.length, max: maxKeys(tree.order) },
  });

  let node: BTreeNode = leaf;
  let depth = path.length - 1;
  while (node.keys.length > maxKeys(tree.order)) {
    const mid = medianIndex(tree.order);
    const median = node.keys[mid]!;
    rec.record({
      kind: 'overflow',
      phase: 'split',
      line: L.middleKey,
      nodeIds: [node.id],
      keys: [median],
      narration: 'overflow',
      params: { size: node.keys.length, max: maxKeys(tree.order), median },
    });

    const right = newNode(
      tree,
      node.keys.slice(mid + 1),
      isLeaf(node) ? [] : node.children.slice(mid + 1),
    );
    node.keys = node.keys.slice(0, mid);
    node.children = isLeaf(node) ? [] : node.children.slice(0, mid + 1);
    rec.record({
      kind: 'split',
      phase: 'split',
      line: L.split,
      nodeIds: [node.id, right.id],
      keys: [median],
      narration: 'split',
      params: { median, left: node.keys.join(', '), right: right.keys.join(', ') },
    });

    if (depth === 0) {
      const root = newNode(tree, [median], [node, right]);
      tree.root = root;
      rec.record({
        kind: 'new-root',
        phase: 'promote',
        line: L.newRoot,
        nodeIds: [root.id],
        keys: [median],
        narration: 'new-root',
        params: { median },
      });
      break;
    }

    const parent = path[depth - 1]!;
    const at = childIndices[depth - 1]!;
    parent.keys.splice(at, 0, median);
    parent.children.splice(at + 1, 0, right);
    rec.record({
      kind: 'promote',
      phase: 'promote',
      line: L.parentAdd,
      nodeIds: [parent.id],
      keys: [median],
      narration: parent.keys.length > maxKeys(tree.order) ? 'promote-overflow' : 'promote',
      params: { median, size: parent.keys.length, max: maxKeys(tree.order) },
    });
    node = parent;
    depth -= 1;
  }

  rec.record({
    kind: 'done',
    phase: 'finish',
    line: L.header,
    narration: 'insert-done',
    params: { key },
  });
  return done();
}

/** Inserts keys one by one; convenient for presets and tests. */
export function buildTree(tree: BTree, keys: number[]): BTree {
  return keys.reduce((t, k) => insert(t, k).result, tree);
}
