import { buildTree } from './insert';
import { seededRandom } from './random';
import { childIndexFor, createTree, fromSpec, isLeaf, toSpec, type NodeSpec } from './tree';
import type { BTree, BTreeNode } from './types';

export const DAILY_TRIO_ORDER = 3;
export const DAILY_PATH_KEY_COUNT = 10;
export const DAILY_PATH_SEARCHES = 3;
export const DAILY_VALID_TREES = 4;
export const DAILY_VALID_KEY_COUNT = 6;
export const DAILY_VALID = 'valid';
export const DAILY_BROKEN = 'broken';

export interface PathSearch {
  target: number;
  present: boolean;
  path: string[];
}

export interface PathMove {
  kind: 'path';
  searchIndex: number;
  target: number;
  at: string;
  answer: string;
}

export interface PathRound {
  tree: BTree;
  searches: PathSearch[];
  moves: PathMove[];
}

function leafKeys(node: BTreeNode): number[] {
  return isLeaf(node) ? [...node.keys] : node.children.flatMap(leafKeys);
}

export function searchPath(tree: BTree, target: number): string[] {
  const ids: string[] = [];
  let node = tree.root;
  while (node) {
    ids.push(node.id);
    if (node.keys.includes(target) || isLeaf(node)) break;
    node = node.children[childIndexFor(node, target)] ?? null;
  }
  return ids;
}

export function pathRound(keys: number[], seed: number, order = DAILY_TRIO_ORDER): PathRound {
  const tree = buildTree(createTree(order), keys);
  const rand = seededRandom(seed);
  const pick = <T>(items: T[]): T => items[Math.floor(rand() * items.length)]!;
  const leaves = leafKeys(tree.root!).sort((a, b) => a - b);
  const lo = Math.min(...keys);
  const hi = Math.max(...keys);
  const gaps: number[] = [];
  for (let k = lo + 1; k < hi; k += 1) if (!keys.includes(k)) gaps.push(k);

  const first = pick(leaves);
  const missing = gaps.length ? pick(gaps) : hi + 1;
  const others = leaves.filter((k) => k !== first);
  const third = others.length ? pick(others) : first;

  const searches = [first, missing, third].map((target) => ({
    target,
    present: keys.includes(target),
    path: searchPath(tree, target),
  }));
  const moves = searches.flatMap((s, searchIndex) =>
    s.path.slice(0, -1).map((at, j) => ({
      kind: 'path' as const,
      searchIndex,
      target: s.target,
      at,
      answer: s.path[j + 1]!,
    })),
  );
  return { tree, searches, moves };
}

export type ValidKind = 'valid' | 'swap' | 'overfull' | 'unsorted';

export interface ValidItem {
  kind: ValidKind;
  tree: BTree;
  valid: boolean;
  reason: string;
  problemNodeId: string | null;
  answer: typeof DAILY_VALID | typeof DAILY_BROKEN;
}

export const VALID_REASON =
  'Every node holds 1 or 2 keys in order, each key is on the correct side of its parents, and all the leaves are level.';

interface Broken {
  spec: NodeSpec;
  reason: string;
  problem: number[];
}

function leafSpecs(spec: NodeSpec): NodeSpec[] {
  return spec.children?.length ? spec.children.flatMap(leafSpecs) : [spec];
}

function allKeys(spec: NodeSpec): number[] {
  return [...spec.keys, ...(spec.children ?? []).flatMap(allKeys)];
}

function breakSwap(spec: NodeSpec): Broken | null {
  const parentOfLeaves = (s: NodeSpec): NodeSpec | null => {
    if (!s.children?.length) return null;
    if (s.children.every((c) => !c.children?.length)) return s;
    for (const c of s.children) {
      const hit = parentOfLeaves(c);
      if (hit) return hit;
    }
    return null;
  };
  const parent = parentOfLeaves(spec);
  if (!parent || parent.children!.length < 2) return null;
  const left = parent.children![0]!;
  const right = parent.children![1]!;
  const sep = parent.keys[0]!;
  const b = left.keys.at(-1)!;
  const c = right.keys[0]!;
  left.keys = [...left.keys.slice(0, -1), c].sort((x, y) => x - y);
  right.keys = [b, ...right.keys.slice(1)].sort((x, y) => x - y);
  return {
    spec,
    reason: `${c} sits on the left of ${sep}, but it's bigger than ${sep}. Bigger keys belong on the right.`,
    problem: left.keys,
  };
}

function breakOverfull(spec: NodeSpec): Broken | null {
  const used = new Set(allKeys(spec));
  for (const leaf of leafSpecs(spec)) {
    if (leaf.keys.length !== 2) continue;
    const [a, b] = leaf.keys as [number, number];
    const m = Math.floor((a + b) / 2);
    if (b - a < 2 || used.has(m)) continue;
    leaf.keys = [a, m, b];
    return {
      spec,
      reason: `The node holding ${a}, ${m}, ${b} has 3 keys. In an order-3 tree a node holds at most 2.`,
      problem: leaf.keys,
    };
  }
  return null;
}

function breakUnsorted(spec: NodeSpec): Broken | null {
  const leaf = leafSpecs(spec).find((l) => l.keys.length === 2);
  if (!leaf) return null;
  const [y, x] = leaf.keys as [number, number];
  leaf.keys = [x, y];
  return {
    spec,
    reason: `${x} comes before ${y} in one node. Keys in a node go smallest to largest.`,
    problem: leaf.keys,
  };
}

const BREAKERS: Record<Exclude<ValidKind, 'valid'>, (spec: NodeSpec) => Broken | null> = {
  swap: breakSwap,
  overfull: breakOverfull,
  unsorted: breakUnsorted,
};

function findByKeys(node: BTreeNode | null, keys: number[]): BTreeNode | null {
  if (!node) return null;
  if (node.keys.join() === keys.join()) return node;
  for (const child of node.children) {
    const hit = findByKeys(child, keys);
    if (hit) return hit;
  }
  return null;
}

export function validItem(keys: number[], kind: ValidKind, order = DAILY_TRIO_ORDER): ValidItem {
  const spec = toSpec(buildTree(createTree(order), keys))!;
  const broken = kind === 'valid' ? null : BREAKERS[kind](spec);
  if (!broken) {
    return {
      kind: 'valid',
      tree: fromSpec(order, spec),
      valid: true,
      reason: VALID_REASON,
      problemNodeId: null,
      answer: DAILY_VALID,
    };
  }
  const tree = fromSpec(order, broken.spec);
  return {
    kind,
    tree,
    valid: false,
    reason: broken.reason,
    problemNodeId: findByKeys(tree.root, broken.problem)?.id ?? null,
    answer: DAILY_BROKEN,
  };
}

export function validKinds(seed: number): ValidKind[] {
  const rand = seededRandom(seed);
  const kinds: ValidKind[] = ['valid', 'swap', 'overfull', 'unsorted'];
  for (let i = kinds.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [kinds[i], kinds[j]] = [kinds[j]!, kinds[i]!];
  }
  return kinds;
}

export function validRound(
  keySets: number[][],
  seed: number,
  order = DAILY_TRIO_ORDER,
): ValidItem[] {
  const kinds = validKinds(seed);
  return keySets.map((keys, i) => validItem(keys, kinds[i % kinds.length]!, order));
}
