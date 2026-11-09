import { isLeaf, maxKeys, minKeys } from './tree';
import type { BTree, BTreeNode } from './types';

/** The B-tree rules a student can be asked to check (objective O2). */
export type BTreeRule =
  | 'max-keys'
  | 'min-keys'
  | 'sorted-keys'
  | 'child-count'
  | 'key-ranges'
  | 'leaf-depth'
  | 'root-children';

export interface RuleViolation {
  rule: BTreeRule;
  nodeId: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  violations: RuleViolation[];
}

/** Checks every B-tree property (NFR1). An empty tree is valid. */
export function validate(tree: BTree): ValidationResult {
  const violations: RuleViolation[] = [];
  const max = maxKeys(tree.order);
  const min = minKeys(tree.order);
  let leafDepth: number | null = null;

  const walk = (node: BTreeNode, depth: number, lo: number, hi: number, isRoot: boolean): void => {
    const add = (rule: BTreeRule, message: string): void => {
      violations.push({ rule, nodeId: node.id, message });
    };

    if (node.keys.length > max)
      add('max-keys', `holds ${node.keys.length} keys; the maximum is ${max}`);
    if (!isRoot && node.keys.length < min) {
      add('min-keys', `holds ${node.keys.length} keys; the minimum is ${min}`);
    }
    if (isRoot && node.keys.length === 0) add('min-keys', 'the root holds no keys');
    for (let i = 1; i < node.keys.length; i += 1) {
      if (node.keys[i - 1]! >= node.keys[i]!) add('sorted-keys', 'keys are not in ascending order');
    }
    for (const k of node.keys) {
      if (k <= lo || k >= hi)
        add('key-ranges', `key ${k} is outside the range allowed by its ancestors`);
    }

    if (isLeaf(node)) {
      if (leafDepth === null) leafDepth = depth;
      else if (depth !== leafDepth) add('leaf-depth', 'leaves are not all on the same level');
      return;
    }

    if (node.children.length !== node.keys.length + 1) {
      add('child-count', `has ${node.keys.length} keys but ${node.children.length} children`);
    }
    if (isRoot && node.children.length < 2)
      add('root-children', 'an internal root needs at least 2 children');

    node.children.forEach((child, i) => {
      const childLo = i === 0 ? lo : node.keys[i - 1]!;
      const childHi = i === node.keys.length ? hi : (node.keys[i] ?? hi);
      walk(child, depth + 1, childLo, childHi, false);
    });
  };

  if (tree.root) walk(tree.root, 0, -Infinity, Infinity, true);
  return { valid: violations.length === 0, violations };
}
