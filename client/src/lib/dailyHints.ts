import { DAILY_NEXT, childIndexFor, isLeaf, type BTreeNode, type DailyMove } from '@btree/engine';

function findNode(root: BTreeNode | null, test: (n: BTreeNode) => boolean): BTreeNode | undefined {
  if (!root) return undefined;
  if (test(root)) return root;
  for (const child of root.children) {
    const hit = findNode(child, test);
    if (hit) return hit;
  }
  return undefined;
}

function rootStep(root: BTreeNode, key: number): string {
  const ks = root.keys;
  const i = childIndexFor(root, key);
  if (i === 0) return `${key} < ${ks[0]}: go left`;
  if (i === ks.length) return `${key} > ${ks.at(-1)}: go right`;
  return `${key} is between ${ks[i - 1]} and ${ks[i]}: go middle`;
}

export function dailyHint(move: DailyMove): string {
  if (move.kind === 'check') return 'This node has too many keys. Drag its middle key up.';
  const root = move.tree.root!;
  if (isLeaf(root)) return `There is only one node, so ${move.key} goes there.`;
  return `At the root, ${rootStep(root, move.key)}. Keep going down to a leaf.`;
}

function parseTry(tried: string | number): { key: number; elsewhere: boolean } | null {
  if (typeof tried === 'number') return { key: tried, elsewhere: false };
  const m = /^(\d+)@/.exec(tried);
  return m ? { key: Number(m[1]), elsewhere: true } : null;
}

export function dailyMistake(move: DailyMove, tried: string | number): string {
  if (move.kind === 'place') {
    if (typeof tried === 'number' || parseTry(tried)) return 'No node has too many keys.';
    const node = findNode(move.tree.root, (n) => n.id === tried);
    return node && !isLeaf(node)
      ? 'New keys only go into a leaf.'
      : `Not this leaf. Compare ${move.key} with the keys from the root down.`;
  }
  if (tried === DAILY_NEXT)
    return 'A node has too many keys. Fix it before adding the next number.';
  const t = parseTry(tried);
  if (t?.elsewhere && t.key === move.answer) {
    return 'Right key, but it moves into the node just above it.';
  }
  const inFull = findNode(move.tree.root, (n) => n.id === move.nodeId)?.keys.includes(t?.key ?? -1);
  return inFull ? "That's not the middle key." : "That key's node isn't too full.";
}
