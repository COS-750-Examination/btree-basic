import type { Operation } from './types';

export interface Pseudocode {
  /** Plain-language pseudocode. Step `line` values index into this (1-based). */
  plain: string[];
  /** Java-flavoured version. Lines are aligned with `plain` so the same `line` highlights both. */
  java: string[];
}

export const PSEUDOCODE: Record<Operation, Pseudocode> = {
  search: {
    plain: [
      'search(node, key):',
      '  i = first index where key <= node.keys[i]',
      '  if i < node.size() and key == node.keys[i]:',
      '    return found',
      '  if node is a leaf:',
      '    return not found',
      '  return search(node.child[i], key)',
    ],
    java: [
      'Node search(Node node, int key) {',
      '  int i = 0; while (i < node.size() && key > node.keys[i]) i++;',
      '  if (i < node.size() && key == node.keys[i])',
      '    return node;',
      '  if (node.isLeaf())',
      '    return null;',
      '  return search(node.child[i], key); }',
    ],
  },
  insert: {
    plain: [
      'insert(key):',
      '  leaf = findLeaf(root, key)',
      '  leaf.addInOrder(key)',
      '  node = leaf',
      '  while node.size() > MAX:',
      '    mid = node.middleKey()',
      '    split node around mid',
      '    if node is root: root = new node(mid)',
      '    else: node.parent.add(mid)',
      '    node = node.parent',
    ],
    java: [
      'void insert(int key) {',
      '  Node leaf = findLeaf(root, key);',
      '  leaf.addInOrder(key);',
      '  Node node = leaf;',
      '  while (node.size() > MAX) {',
      '    int mid = node.middleKey();',
      '    Node right = node.splitAround(mid);',
      '    if (node == root) root = new Node(mid, node, right);',
      '    else node.parent.add(mid, right);',
      '    node = node.parent; } }',
    ],
  },
  delete: {
    plain: [
      'delete(key):',
      '  node = find(root, key)',
      '  if node is internal:',
      '    pred = largest key in left subtree',
      '    replace key with pred; node = leaf of pred',
      '  remove key from node',
      '  while node is not root and node.size() < MIN:',
      '    if a sibling has a spare key:',
      '      borrow through the parent; stop',
      '    else:',
      '      merge with sibling and parent separator',
      '      node = node.parent',
      '  if root is empty: root = root.child[0]',
    ],
    java: [
      'void delete(int key) {',
      '  Node node = find(root, key);',
      '  if (!node.isLeaf()) {',
      '    int pred = node.child[i].maxKey();',
      '    node.keys[i] = pred; node = leafOf(pred); }',
      '  node.remove(key);',
      '  while (node != root && node.size() < MIN) {',
      '    if (sibling.size() > MIN)',
      '      { borrow(node, sibling); break; }',
      '    else {',
      '      merge(node, sibling);',
      '      node = node.parent; } }',
      '  if (root.size() == 0) root = root.child[0]; }',
    ],
  },
};
