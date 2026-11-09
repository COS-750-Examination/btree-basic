import type { BTreeRule } from '@btree/engine';

/** Student-facing names of the B-tree rules (objective O2). */
export const RULE_LABELS: Record<BTreeRule, string> = {
  'max-keys': 'A node holds too many keys',
  'min-keys': 'A node holds too few keys',
  'sorted-keys': 'Keys in a node are not sorted',
  'child-count': 'Wrong number of children for its keys',
  'key-ranges': 'A key is in the wrong subtree',
  'leaf-depth': 'Leaves are not all on the same level',
  'root-children': 'The root has too few children',
};
