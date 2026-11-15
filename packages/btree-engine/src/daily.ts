import { insert } from './insert';
import { childIndexFor, createTree, isLeaf } from './tree';
import type { BTree, BTreeNode } from './types';

export const DAILY_ORDER = 3;
export const DAILY_KEY_COUNT = 8;

export const DAILY_NEXT = 'next';

export interface DailyPlaceMove {
  kind: 'place';
  key: number;
  keyIndex: number;
  tree: BTree;
  answer: string;
}

export interface DailyCheckMove {
  kind: 'check';
  key: number;
  keyIndex: number;
  tree: BTree;
  nodeId: string;
  answer: number;
}

export type DailyMove = DailyPlaceMove | DailyCheckMove;

function targetLeaf(root: BTreeNode, key: number): BTreeNode {
  let node = root;
  while (!isLeaf(node)) node = node.children[childIndexFor(node, key)]!;
  return node;
}

export function dailyMoves(keys: number[], order = DAILY_ORDER): DailyMove[] {
  const moves: DailyMove[] = [];
  let tree = createTree(order);
  keys.forEach((key, keyIndex) => {
    if (tree.root) {
      moves.push({ kind: 'place', key, keyIndex, tree, answer: targetLeaf(tree.root, key).id });
    }
    const trace = insert(tree, key);
    for (const step of trace.steps) {
      if (step.kind !== 'overflow') continue;
      moves.push({
        kind: 'check',
        key,
        keyIndex,
        tree: step.tree,
        nodeId: step.nodeIds[0]!,
        answer: Number(step.params.median),
      });
    }
    tree = trace.result;
  });
  return moves;
}

export interface DailyPlay {
  tries: (string | number)[];
  hint: boolean;
}

export interface DailyTally {
  mistakes: number;
  hints: number;
  complete: boolean;
}

export function dailyTally(moves: DailyMove[], plays: DailyPlay[]): DailyTally {
  let mistakes = 0;
  let hints = 0;
  let complete = plays.length === moves.length;
  moves.forEach((m, i) => {
    const play = plays[i];
    if (!play) {
      complete = false;
      return;
    }
    if (play.tries.at(-1) !== m.answer) complete = false;
    mistakes += new Set(play.tries.filter((t) => t !== m.answer)).size;
    if (play.hint) hints += 1;
  });
  return { mistakes, hints, complete };
}
