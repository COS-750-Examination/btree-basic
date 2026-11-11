import type { ReactNode } from 'react';
import { cn } from '../ui/cn';

/**
 * Shared frame for every grove scene: Figma's 832×480 "Grove scene", anchored to the bottom so
 * the hills always meet the card edge. GroveTree draws in the same frame, so the two line up.
 */
export const SCENE_VIEWBOX = '0 0 832 480';
export const SCENE_ASPECT = 'xMidYMax slice';

/** Front hill, drawn by the backdrop and again by GroveTree so it covers the trunk's foot. */
export function FrontHill() {
  return (
    <path
      d="M0 420C208 392 416 412 599.04 398C782.08 384 782.08 394 832 406V480H0V420Z"
      fill="var(--hill-3)"
      className="drop-shadow-lift"
    />
  );
}

const FIREFLIES = [
  [146, 150, 3],
  [266, 90, 2.5],
  [576, 190, 3],
  [716, 220, 2.5],
  [196, 260, 2.5],
  [526, 70, 2],
] as const;

/**
 * Sky, sun or moon, clouds, fireflies and three hills (Figma: 09 My grove → Grove scene).
 * The moon's cut-out and the fireflies use tokens that are transparent in Day, exactly as in
 * Figma, so no theme check is needed. `art` is drawn over the hills, and children go on top.
 */
export function SceneBackdrop({
  art,
  children,
  className,
}: {
  art?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('shadow-paper-stack relative overflow-hidden rounded-lg bg-sky-200', className)}
    >
      <svg
        aria-hidden
        viewBox={SCENE_VIEWBOX}
        preserveAspectRatio={SCENE_ASPECT}
        className="absolute inset-0 h-full w-full"
      >
        <g fill="var(--firefly)">
          {FIREFLIES.map(([cx, cy, r]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
          ))}
        </g>
        <circle cx="666" cy="96" r="40" fill="var(--sun)" className="drop-shadow-lift" />
        <circle cx="684" cy="84" r="36" fill="var(--moon-cut)" />
        <g fill="var(--cloud)" className="drop-shadow-lift">
          <ellipse cx="176" cy="80" rx="60" ry="20" />
          <ellipse cx="206" cy="68" rx="36" ry="18" />
          <ellipse cx="576" cy="140" rx="46" ry="15" />
        </g>
        <path
          d="M0 320C158.08 270 324.48 296 465.92 286C607.36 276 715.52 262 832 292V480H0V320Z"
          fill="var(--hill-1)"
          className="drop-shadow-lift"
        />
        <path
          d="M0 370C183.04 336 349.44 356 515.84 344C682.24 332 748.8 334 832 352V480H0V370Z"
          fill="var(--hill-2)"
          className="drop-shadow-lift"
        />
        <FrontHill />
      </svg>
      {art}
      <div className="relative">{children}</div>
    </div>
  );
}
