import type { BTree, BTreeNode } from './types';

export const MIN_ORDER = 3;
export const MAX_ORDER = 7;

export function assertOrder(order: number): void {
  if (!Number.isInteger(order) || order < MIN_ORDER || order > MAX_ORDER) {
    throw new RangeError(`B-tree order must be an integer from ${MIN_ORDER} to ${MAX_ORDER}`);
  }
}

/** Most keys a node may hold: m - 1. */
export const maxKeys = (order: number): number => order - 1;

/** Fewest keys a non-root node may hold: ceil(m/2) - 1. */
export const minKeys = (order: number): number => Math.ceil(order / 2) - 1;

/**
 * Index of the key promoted when a node holding `order` keys splits.
 * ceil(m/2) - 1, so for odd m it is the exact median; for even m the left half is the smaller one.
 */
export const medianIndex = (order: number): number => Math.ceil(order / 2) - 1;

export const isLeaf = (node: BTreeNode): boolean => node.children.length === 0;

export function createTree(order: number): BTree {
  assertOrder(order);
  return { order, root: null, nextId: 1 };
}

export function newNode(tree: BTree, keys: number[] = [], children: BTreeNode[] = []): BTreeNode {
  const node: BTreeNode = { id: `n${tree.nextId}`, keys, children };
  tree.nextId += 1;
  return node;
}

export function cloneTree(tree: BTree): BTree {
  return structuredClone(tree);
}

/** Literal description of a tree, convenient for lesson and quiz content. */
export interface NodeSpec {
  keys: number[];
  children?: NodeSpec[];
}

/** Builds a tree with an exact shape, e.g. `fromSpec(3, { keys: [20], children: [{ keys: [8, 12] }, { keys: [28, 30] }] })`. */
export function fromSpec(order: number, spec: NodeSpec | null): BTree {
  const tree = createTree(order);
  const build = (s: NodeSpec): BTreeNode => {
    const node = newNode(tree, [...s.keys]);
    node.children = (s.children ?? []).map(build);
    return node;
  };
  tree.root = spec ? build(spec) : null;
  return tree;
}

export function toSpec(tree: BTree): NodeSpec | null {
  const walk = (n: BTreeNode): NodeSpec =>
    isLeaf(n) ? { keys: [...n.keys] } : { keys: [...n.keys], children: n.children.map(walk) };
  return tree.root ? walk(tree.root) : null;
}

/** All keys in ascending (in-order) order. */
export function inOrderKeys(tree: BTree): number[] {
  const out: number[] = [];
  const walk = (n: BTreeNode): void => {
    n.keys.forEach((k, i) => {
      if (!isLeaf(n)) walk(n.children[i]!);
      out.push(k);
    });
    if (!isLeaf(n)) walk(n.children[n.keys.length]!);
  };
  if (tree.root) walk(tree.root);
  return out;
}

/** Number of levels (0 for an empty tree). */
export function height(tree: BTree): number {
  let h = 0;
  let node = tree.root;
  while (node) {
    h += 1;
    node = node.children[0] ?? null;
  }
  return h;
}

/** Index of the first key >= `key`, i.e. the child to follow when `key` is not in the node. */
export function childIndexFor(node: BTreeNode, key: number): number {
  let i = 0;
  while (i < node.keys.length && key > node.keys[i]!) i += 1;
  return i;
}
