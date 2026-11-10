import type { BTree, BTreeNode } from '@btree/engine';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo } from 'react';
import { BEAD_R, beadOffset, layoutTree, type PositionedNode } from '../../lib/layout';
import { cn } from '../ui/cn';
import { KeyBead, type BeadState } from './KeyBead';

export interface Callout {
  nodeId: string;
  text: string;
  tone?: 'accent' | 'danger';
}

export interface BTreeViewProps {
  tree: BTree;
  /** Accessible summary of what the picture shows. */
  label: string;
  newKey?: number;
  medianKey?: number;
  foundKey?: number;
  /** Node drawn as an overflowing (coral) branch. */
  overflowNodeId?: string;
  highlightNodeIds?: string[];
  /** Edge ids ("parentId>childId") drawn as the golden yarn of the search path. */
  yarnEdges?: string[];
  callouts?: Callout[];
  /** Makes nodes keyboard-focusable buttons (practice and quiz items). */
  onNodeClick?: (node: BTreeNode) => void;
  selectedNodeIds?: string[];
  /** Draw sky and rolling hills behind the tree (visualiser and quiz cards). */
  scene?: boolean;
  className?: string;
}

const spring = { type: 'spring', stiffness: 260, damping: 28 } as const;

function edgePath(from: PositionedNode, to: PositionedNode, childIndex: number): string {
  const keys = Math.max(1, from.node.keys.length);
  const x1 = from.x - from.width / 2 + 10 + (childIndex / keys) * (from.width - 20);
  const y1 = from.y + BEAD_R;
  const x2 = to.x;
  const y2 = to.y - BEAD_R;
  const my = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
}

export function BTreeView({
  tree,
  label,
  newKey,
  medianKey,
  foundKey,
  overflowNodeId,
  highlightNodeIds = [],
  yarnEdges = [],
  callouts = [],
  onNodeClick,
  selectedNodeIds = [],
  scene = false,
  className,
}: BTreeViewProps) {
  const layout = useMemo(() => layoutTree(tree), [tree]);
  // A floor on the canvas width keeps small trees from being blown up to fill the card.
  const width = Math.max(layout.width, 640);
  const height = layout.height + (scene ? 60 : 0) + (callouts.length ? 24 : 0);
  const offsetX = (width - layout.width) / 2;
  const yarn = new Set(yarnEdges);
  const byId = new Map(layout.nodes.map((n) => [n.node.id, n]));

  const beadState = (k: number): BeadState =>
    k === medianKey ? 'median' : k === foundKey ? 'found' : k === newKey ? 'new' : 'normal';

  if (!tree.root) {
    return (
      <div className={cn('text-ink-muted grid place-items-center rounded-lg p-10', className)}>
        The tree is empty. Insert a key to plant it.
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('h-auto w-full', className)}
      role={onNodeClick ? 'group' : 'img'}
      aria-label={label}
    >
      {scene && (
        <g aria-hidden>
          <path
            d={`M0 ${height - 50} Q ${width * 0.3} ${height - 80} ${width * 0.6} ${height - 55} T ${width} ${height - 60} V ${height} H 0 Z`}
            fill="var(--hill-1)"
          />
          <path
            d={`M0 ${height - 28} Q ${width * 0.4} ${height - 50} ${width} ${height - 30} V ${height} H 0 Z`}
            fill="var(--hill-2)"
          />
        </g>
      )}
      <g transform={`translate(${offsetX} ${callouts.length ? 24 : 0})`}>
        {layout.edges.map((e) => (
          <motion.path
            key={e.id}
            initial={false}
            animate={{ d: edgePath(e.from, e.to, e.childIndex) }}
            transition={spring}
            fill="none"
            stroke={yarn.has(e.id) ? 'var(--yarn)' : 'var(--branch)'}
            strokeWidth={yarn.has(e.id) ? 4 : 2}
            strokeDasharray={yarn.has(e.id) ? undefined : '6 5'}
            strokeLinecap="round"
          />
        ))}

        {layout.nodes.map((p) => {
          const { node } = p;
          const overflow = node.id === overflowNodeId;
          const highlighted =
            highlightNodeIds.includes(node.id) || selectedNodeIds.includes(node.id);
          const interactive = Boolean(onNodeClick);
          const nodeLabel = `Node with keys ${node.keys.join(', ')}${overflow ? ', overflowing' : ''}${
            selectedNodeIds.includes(node.id) ? ', selected' : ''
          }`;
          return (
            <motion.g
              key={node.id}
              initial={false}
              animate={{ x: p.x, y: p.y }}
              transition={spring}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={interactive ? nodeLabel : undefined}
              aria-pressed={interactive ? selectedNodeIds.includes(node.id) : undefined}
              onClick={interactive ? () => onNodeClick?.(node) : undefined}
              onKeyDown={
                interactive
                  ? (ev) => {
                      if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault();
                        onNodeClick?.(node);
                      }
                    }
                  : undefined
              }
              className={
                interactive
                  ? 'cursor-pointer outline-none [&:focus-visible>rect]:stroke-[var(--yarn)]'
                  : undefined
              }
            >
              <rect
                x={-p.width / 2}
                y={-BEAD_R - 6}
                width={p.width}
                height={BEAD_R * 2 + 12}
                rx={BEAD_R + 6}
                fill={overflow ? 'var(--danger)' : 'var(--branch)'}
                stroke={highlighted ? 'var(--yarn)' : 'transparent'}
                strokeWidth={4}
                className="drop-shadow-lift"
              />
              <AnimatePresence initial={false}>
                {node.keys.map((k, i) => (
                  <KeyBead
                    key={k}
                    value={k}
                    x={beadOffset(i, node.keys.length)}
                    state={beadState(k)}
                  />
                ))}
              </AnimatePresence>
            </motion.g>
          );
        })}

        {callouts.map((c) => {
          const p = byId.get(c.nodeId);
          if (!p) return null;
          const w = c.text.length * 7 + 20;
          // Keep the label inside the canvas.
          const x = Math.max(
            -offsetX + 4,
            Math.min(p.x + p.width / 2 - 10, width - offsetX - w - 4),
          );
          const y = p.y - BEAD_R - 34;
          return (
            <g key={c.nodeId + c.text} transform={`translate(${x} ${y}) rotate(-2)`} aria-hidden>
              <rect
                width={w}
                height={24}
                rx={4}
                fill={c.tone === 'danger' ? 'var(--paper)' : 'var(--highlight)'}
              />
              <text
                x={10}
                y={16}
                className="font-sans font-bold"
                style={{ fontSize: 12 }}
                fill={c.tone === 'danger' ? 'var(--danger-text)' : 'var(--on-highlight)'}
              >
                {c.text}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
