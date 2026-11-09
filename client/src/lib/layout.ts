import type { BTree, BTreeNode } from '@btree/engine';

/** Geometry shared by the SVG tree components. */
export const BEAD_R = 18;
export const BEAD_GAP = 4;
export const NODE_PAD = 6;
export const LEVEL_GAP = 92;
export const SIBLING_GAP = 28;

export const nodeWidth = (keyCount: number) =>
  Math.max(1, keyCount) * (BEAD_R * 2) + Math.max(0, keyCount - 1) * BEAD_GAP + NODE_PAD * 2;

export interface PositionedNode {
  node: BTreeNode;
  /** Centre x and y. */
  x: number;
  y: number;
  width: number;
  depth: number;
}

export interface Edge {
  id: string;
  from: PositionedNode;
  to: PositionedNode;
  childIndex: number;
}

export interface TreeLayout {
  nodes: PositionedNode[];
  edges: Edge[];
  width: number;
  height: number;
}

/**
 * Tidy layout: leaves are packed left to right, each parent is centred over its children.
 * Good enough for the ~40-key trees the app shows (NFR5).
 */
export function layoutTree(tree: BTree, padding = 32): TreeLayout {
  const nodes: PositionedNode[] = [];
  const edges: Edge[] = [];
  if (!tree.root) return { nodes, edges, width: 0, height: 0 };

  let cursor = padding;
  const place = (node: BTreeNode, depth: number): PositionedNode => {
    const width = nodeWidth(node.keys.length);
    const y = padding + BEAD_R + depth * LEVEL_GAP;
    let positioned: PositionedNode;
    if (node.children.length === 0) {
      positioned = { node, x: cursor + width / 2, y, width, depth };
      cursor += width + SIBLING_GAP;
    } else {
      const kids = node.children.map((c) => place(c, depth + 1));
      const x = (kids[0]!.x + kids[kids.length - 1]!.x) / 2;
      positioned = { node, x, y, width, depth };
      kids.forEach((k, i) =>
        edges.push({ id: `${node.id}>${k.node.id}`, from: positioned, to: k, childIndex: i }),
      );
    }
    nodes.push(positioned);
    return positioned;
  };
  place(tree.root, 0);

  const maxDepth = Math.max(...nodes.map((n) => n.depth));
  return {
    nodes,
    edges,
    width: Math.max(
      cursor - SIBLING_GAP + padding,
      ...nodes.map((n) => n.x + n.width / 2 + padding),
    ),
    height: padding * 2 + BEAD_R * 2 + maxDepth * LEVEL_GAP,
  };
}

/** x offset of the i-th bead's centre relative to the node centre. */
export function beadOffset(i: number, keyCount: number): number {
  const w = nodeWidth(keyCount) - NODE_PAD * 2;
  return -w / 2 + BEAD_R + i * (BEAD_R * 2 + BEAD_GAP);
}
