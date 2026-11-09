import { Recorder } from './recorder';
import { descend } from './search';
import { cloneTree, isLeaf, minKeys } from './tree';
import type { BTree, BTreeNode, Trace } from './types';

/** Pseudocode lines for `delete` (see pseudocode.ts). */
const L = {
  header: 1,
  find: 2,
  predecessor: 4,
  replace: 5,
  remove: 6,
  underflowCheck: 7,
  borrow: 9,
  merge: 11,
  moveUp: 12,
  shrinkRoot: 13,
} as const;

/**
 * Deletion with predecessor replacement: a key in an internal node is swapped with the
 * largest key of its left subtree, so the physical removal always happens in a leaf.
 * Underflow (fewer than ceil(m/2) - 1 keys) is fixed by borrowing from a sibling through
 * the parent, or by merging with a sibling and the separating parent key, repeating upward.
 */
export function remove(input: BTree, key: number): Trace {
  const tree = cloneTree(input);
  const rec = new Recorder(tree);
  const done = (): Trace => ({
    operation: 'delete',
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
    narration: 'delete-start',
    params: { key },
  });

  if (!tree.root) {
    rec.record({
      kind: 'not-found',
      phase: 'finish',
      line: L.find,
      narration: 'empty-tree',
      params: { key },
    });
    return done();
  }

  const { path, childIndices, foundAt } = descend(tree, key, rec, {
    compare: L.find,
    descend: L.find,
  });
  let node = path[path.length - 1]!;

  if (foundAt < 0) {
    rec.record({
      kind: 'not-found',
      phase: 'finish',
      line: L.find,
      nodeIds: [node.id],
      narration: 'delete-not-found',
      params: { key },
    });
    return done();
  }

  if (!isLeaf(node)) {
    // Walk to the rightmost leaf of the left subtree to find the predecessor.
    const holder = node;
    childIndices.push(foundAt);
    let cur: BTreeNode = holder.children[foundAt]!;
    path.push(cur);
    while (!isLeaf(cur)) {
      const last = cur.children.length - 1;
      rec.record({
        kind: 'descend',
        phase: 'find',
        line: L.predecessor,
        nodeIds: [cur.id, cur.children[last]!.id],
        narration: 'predecessor-descend',
        params: { key },
      });
      childIndices.push(last);
      cur = cur.children[last]!;
      path.push(cur);
    }
    const pred = cur.keys[cur.keys.length - 1]!;
    holder.keys[foundAt] = pred;
    cur.keys.pop();
    rec.record({
      kind: 'replace-predecessor',
      phase: 'remove',
      line: L.replace,
      nodeIds: [holder.id, cur.id],
      keys: [pred],
      narration: 'replace-predecessor',
      params: { key, pred },
    });
    node = cur;
  } else {
    node.keys.splice(foundAt, 1);
    rec.record({
      kind: 'remove-key',
      phase: 'remove',
      line: L.remove,
      nodeIds: [node.id],
      keys: [key],
      narration: 'remove-key',
      params: { key },
    });
  }

  const min = minKeys(tree.order);
  let depth = path.length - 1;
  while (depth > 0 && node.keys.length < min) {
    rec.record({
      kind: 'underflow',
      phase: 'rebalance',
      line: L.underflowCheck,
      nodeIds: [node.id],
      narration: 'underflow',
      params: { size: node.keys.length, min },
    });
    const parent = path[depth - 1]!;
    const idx = childIndices[depth - 1]!;
    const left = idx > 0 ? parent.children[idx - 1]! : null;
    const right = idx < parent.children.length - 1 ? parent.children[idx + 1]! : null;

    if (left && left.keys.length > min) {
      const separator = parent.keys[idx - 1]!;
      node.keys.unshift(separator);
      parent.keys[idx - 1] = left.keys.pop()!;
      if (!isLeaf(left)) node.children.unshift(left.children.pop()!);
      rec.record({
        kind: 'borrow-left',
        phase: 'rebalance',
        line: L.borrow,
        nodeIds: [left.id, parent.id, node.id],
        keys: [separator, parent.keys[idx - 1]!],
        narration: 'borrow-left',
        params: { down: separator, up: parent.keys[idx - 1]! },
      });
      break;
    }
    if (right && right.keys.length > min) {
      const separator = parent.keys[idx]!;
      node.keys.push(separator);
      parent.keys[idx] = right.keys.shift()!;
      if (!isLeaf(right)) node.children.push(right.children.shift()!);
      rec.record({
        kind: 'borrow-right',
        phase: 'rebalance',
        line: L.borrow,
        nodeIds: [right.id, parent.id, node.id],
        keys: [separator, parent.keys[idx]!],
        narration: 'borrow-right',
        params: { down: separator, up: parent.keys[idx]! },
      });
      break;
    }

    // No sibling can spare a key: merge with one, pulling the separator down.
    let kept: BTreeNode;
    let separator: number;
    if (left) {
      separator = parent.keys[idx - 1]!;
      left.keys.push(separator, ...node.keys);
      left.children.push(...node.children);
      parent.keys.splice(idx - 1, 1);
      parent.children.splice(idx, 1);
      kept = left;
    } else {
      const r = right!;
      separator = parent.keys[idx]!;
      node.keys.push(separator, ...r.keys);
      node.children.push(...r.children);
      parent.keys.splice(idx, 1);
      parent.children.splice(idx + 1, 1);
      kept = node;
    }
    rec.record({
      kind: 'merge',
      phase: 'rebalance',
      line: L.merge,
      nodeIds: [kept.id, parent.id],
      keys: [separator],
      narration: 'merge',
      params: { separator, keys: kept.keys.join(', ') },
    });
    node = parent;
    depth -= 1;
  }

  const root = tree.root!;
  if (root.keys.length === 0) {
    tree.root = isLeaf(root) ? null : root.children[0]!;
    rec.record({
      kind: 'shrink-root',
      phase: 'rebalance',
      line: L.shrinkRoot,
      nodeIds: tree.root ? [tree.root.id] : [],
      narration: tree.root ? 'shrink-root' : 'tree-empty',
      params: {},
    });
  }

  rec.record({
    kind: 'done',
    phase: 'finish',
    line: L.header,
    narration: 'delete-done',
    params: { key },
  });
  return done();
}
