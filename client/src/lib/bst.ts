import type { TreeSpec } from '@btree/shared';

/** Builds an unbalanced BST spec from keys in insertion order (for the height comparison). */
export function bstFromKeys(keys: number[]): TreeSpec | null {
  type N = { key: number; left?: N; right?: N };
  let root: N | undefined;
  for (const key of keys) {
    if (!root) {
      root = { key };
      continue;
    }
    let cur = root;
    for (;;) {
      if (key < cur.key) {
        if (!cur.left) {
          cur.left = { key };
          break;
        }
        cur = cur.left;
      } else if (key > cur.key) {
        if (!cur.right) {
          cur.right = { key };
          break;
        }
        cur = cur.right;
      } else break;
    }
  }
  // Missing children become empty slots so BSTView can tell left from right.
  const toSpec = (n: N | undefined): TreeSpec | undefined =>
    n && {
      keys: [n.key],
      children: n.left || n.right ? ([toSpec(n.left), toSpec(n.right)] as TreeSpec[]) : undefined,
    };
  return toSpec(root) ?? null;
}
