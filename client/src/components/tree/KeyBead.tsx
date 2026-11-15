import { motion } from 'motion/react';
import { BEAD_R, TREE_SPRING } from '../../lib/layout';

export type BeadState = 'normal' | 'new' | 'median' | 'found';

/**
 * One key drawn as a bead with a wooden ring. State is shown by ring/fill *and* by a
 * screen-reader label, so colour is never the only cue (NFR4).
 */
export function KeyBead({
  value,
  x,
  state = 'normal',
}: {
  value: number;
  x: number;
  state?: BeadState;
}) {
  const fill = state === 'median' || state === 'found' ? 'var(--highlight)' : 'var(--node-fill)';
  const ring = state === 'new' ? 'var(--yarn)' : 'var(--branch)';
  const text = state === 'median' || state === 'found' ? 'var(--on-highlight)' : 'var(--ink)';
  return (
    <motion.g
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ x, scale: 1, opacity: 1 }}
      exit={{ scale: 0.6, opacity: 0, transition: { duration: 0.25 } }}
      transition={TREE_SPRING}
    >
      <circle
        r={BEAD_R}
        style={{
          fill,
          stroke: ring,
          strokeWidth: state === 'new' ? 4 : 3.5,
          transition: 'fill 0.45s ease, stroke 0.45s ease',
        }}
      />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        className="font-display"
        style={{ fontSize: value >= 100 ? 12 : 15, fill: text, transition: 'fill 0.45s ease' }}
      >
        {value}
      </text>
    </motion.g>
  );
}
