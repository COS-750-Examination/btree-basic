import type { TreeSpec } from '@btree/shared';
import { BEAD_R } from '../../lib/layout';
import { cn } from '../ui/cn';

interface Placed {
  key: number;
  x: number;
  y: number;
  parent?: Placed;
}

/** A binary search tree drawn with round wooden beads (warm-up and the "Cut out a BST too" comparison). */
export function BSTView({
  spec,
  label,
  className,
}: {
  spec: TreeSpec;
  label: string;
  className?: string;
}) {
  const placed: Placed[] = [];
  let index = 0;
  const walk = (s: TreeSpec | undefined, depth: number, parent?: Placed) => {
    if (!s) return;
    const [left, right] = s.children ?? [];
    const me: Placed = { key: s.keys[0]!, x: 0, y: 40 + depth * 72, parent };
    walk(left, depth + 1, me);
    me.x = 40 + index * 56;
    index += 1;
    placed.push(me);
    walk(right, depth + 1, me);
  };
  walk(spec, 0);
  const width = Math.max(200, 40 + index * 56);
  const height = Math.max(...placed.map((p) => p.y)) + 40;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('h-auto w-full max-w-md', className)}
      role="img"
      aria-label={label}
    >
      {placed
        .filter((p) => p.parent)
        .map((p) => (
          <line
            key={`e${p.key}`}
            x1={p.parent!.x}
            y1={p.parent!.y}
            x2={p.x}
            y2={p.y}
            stroke="var(--ink-muted)"
            strokeWidth={2}
            strokeDasharray="6 5"
          />
        ))}
      {placed.map((p) => (
        <g key={p.key} transform={`translate(${p.x} ${p.y})`}>
          <circle r={BEAD_R + 6} fill="var(--node-fill)" stroke="var(--branch)" strokeWidth={6} />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            className="font-display"
            style={{ fontSize: 15 }}
            fill="var(--ink)"
          >
            {p.key}
          </text>
        </g>
      ))}
    </svg>
  );
}
