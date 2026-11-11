import type { GrowthStageId } from '@btree/shared';
import { cn } from '../ui/cn';

/*
 * Growth-stage art from the Figma "How it grows" strip (Screens → 09 My grove → Stage/*).
 * Coordinates are Figma's own (the strip's frame), so each stage is shifted into a 60×58 box.
 * Young tree and Full tree are only drawn as dashed outlines in Figma (future stages); their
 * filled versions reuse that exact geometry with the Sapling's colours and details.
 */

type Part = 'ground' | 'body' | 'detail';
type Shape =
  | { part: Part; kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number; fill: string }
  | { part: Part; kind: 'circle'; cx: number; cy: number; r: number; fill: string }
  | { part: Part; kind: 'stem'; x: number; y1: number; y2: number; width: number; stroke: string }
  | { part: Part; kind: 'path'; d: string; fill: string };

const ground = (cx: number, cy = 58, rx = 26, ry = 9): Shape => ({
  part: 'ground',
  kind: 'ellipse',
  cx,
  cy,
  rx,
  ry,
  fill: 'var(--hill-2)',
});

const STAGES: Record<GrowthStageId, { x: number; shapes: Shape[] }> = {
  seed: {
    x: 32.667,
    shapes: [
      ground(62.667),
      { part: 'body', kind: 'ellipse', cx: 62.667, cy: 52, rx: 5, ry: 4, fill: 'var(--branch)' },
    ],
  },
  sprout: {
    x: 166,
    shapes: [
      ground(196),
      { part: 'body', kind: 'stem', x: 196, y1: 52, y2: 38, width: 3, stroke: 'var(--leaf-dark)' },
      {
        part: 'body',
        kind: 'path',
        d: 'M191.691 41.6252C195.195 39.9914 197.278 37.0438 196.345 35.0416C195.411 33.0395 191.814 32.7409 188.31 34.3747C184.806 36.0086 182.723 38.9561 183.656 40.9583C184.59 42.9605 188.187 43.259 191.691 41.6252Z',
        fill: 'var(--leaf)',
      },
      {
        part: 'body',
        kind: 'path',
        d: 'M200.31 39.6252C203.814 41.2591 207.411 40.9605 208.345 38.9583C209.278 36.9562 207.195 34.0086 203.691 32.3748C200.187 30.7409 196.59 31.0395 195.656 33.0417C194.723 35.0438 196.806 37.9914 200.31 39.6252Z',
        fill: 'var(--leaf-light)',
      },
    ],
  },
  shrub: {
    x: 299.333,
    shapes: [
      ground(329.334),
      { part: 'body', kind: 'circle', cx: 321.334, cy: 46, r: 10, fill: 'var(--leaf)' },
      { part: 'body', kind: 'circle', cx: 337.334, cy: 46, r: 10, fill: 'var(--leaf)' },
      { part: 'body', kind: 'circle', cx: 329.334, cy: 38, r: 11, fill: 'var(--leaf-light)' },
    ],
  },
  sapling: {
    x: 432.667,
    shapes: [
      ground(462.667),
      { part: 'body', kind: 'stem', x: 462.667, y1: 52, y2: 32, width: 4, stroke: 'var(--branch)' },
      { part: 'body', kind: 'circle', cx: 462.667, cy: 28, r: 14, fill: 'var(--leaf)' },
      { part: 'detail', kind: 'circle', cx: 457.667, cy: 23, r: 5, fill: 'var(--leaf-light)' },
      { part: 'detail', kind: 'circle', cx: 466.667, cy: 32, r: 2.6, fill: 'var(--apple)' },
      { part: 'detail', kind: 'circle', cx: 455.667, cy: 31, r: 2.2, fill: 'var(--blossom)' },
    ],
  },
  'young-tree': {
    x: 566,
    shapes: [
      ground(596),
      { part: 'body', kind: 'stem', x: 596, y1: 54, y2: 36, width: 4, stroke: 'var(--branch)' },
      { part: 'body', kind: 'circle', cx: 587, cy: 30, r: 11, fill: 'var(--leaf)' },
      { part: 'body', kind: 'circle', cx: 605, cy: 30, r: 11, fill: 'var(--leaf)' },
      { part: 'detail', kind: 'circle', cx: 584, cy: 26, r: 4, fill: 'var(--leaf-light)' },
      { part: 'detail', kind: 'circle', cx: 609, cy: 34, r: 2.6, fill: 'var(--apple)' },
      { part: 'detail', kind: 'circle', cx: 590, cy: 35, r: 2.2, fill: 'var(--blossom)' },
    ],
  },
  'full-tree': {
    x: 699.333,
    shapes: [
      ground(729.334, 60, 28, 7),
      { part: 'body', kind: 'stem', x: 729.334, y1: 56, y2: 38, width: 4, stroke: 'var(--branch)' },
      { part: 'body', kind: 'circle', cx: 716.334, cy: 30, r: 12, fill: 'var(--leaf)' },
      { part: 'body', kind: 'circle', cx: 742.334, cy: 30, r: 12, fill: 'var(--leaf)' },
      { part: 'body', kind: 'circle', cx: 729.334, cy: 21, r: 11, fill: 'var(--leaf-light)' },
      { part: 'detail', kind: 'circle', cx: 722, cy: 35, r: 2.6, fill: 'var(--apple)' },
      { part: 'detail', kind: 'circle', cx: 740, cy: 27, r: 2.6, fill: 'var(--apple)' },
      { part: 'detail', kind: 'circle', cx: 733, cy: 16, r: 2.2, fill: 'var(--blossom)' },
    ],
  },
};

/** Figma's future-stage style: dashed ink-muted outline, no fill. */
const OUTLINE = {
  fill: 'none',
  stroke: 'var(--ink-muted)',
  strokeWidth: 1.5,
  strokeDasharray: '4 3',
} as const;

/**
 * One stage as an SVG group in a 60×58 box (ground centre at 30, 48). `outline` draws the dashed
 * future-stage style; `withGround={false}` drops the grass oval, for the grove scene.
 */
export function StageArt({
  stage,
  outline = false,
  withGround = true,
}: {
  stage: GrowthStageId;
  outline?: boolean;
  withGround?: boolean;
}) {
  const { x, shapes } = STAGES[stage];
  return (
    <g transform={`translate(${-x} -10)`}>
      {shapes
        .filter((s) => (withGround || s.part !== 'ground') && (!outline || s.part !== 'detail'))
        .map((s, i) => {
          switch (s.kind) {
            case 'ellipse':
              return (
                <ellipse
                  key={i}
                  cx={s.cx}
                  cy={s.cy}
                  rx={s.rx}
                  ry={s.ry}
                  {...(outline ? OUTLINE : { fill: s.fill })}
                />
              );
            case 'circle':
              return (
                <circle
                  key={i}
                  cx={s.cx}
                  cy={s.cy}
                  r={s.r}
                  {...(outline ? OUTLINE : { fill: s.fill })}
                />
              );
            case 'stem':
              return (
                <path
                  key={i}
                  d={`M${s.x} ${s.y1}V${s.y2}`}
                  strokeLinecap="round"
                  {...(outline ? OUTLINE : { stroke: s.stroke, strokeWidth: s.width })}
                />
              );
            case 'path':
              return <path key={i} d={s.d} {...(outline ? OUTLINE : { fill: s.fill })} />;
          }
        })}
    </g>
  );
}

/** A stage icon (Figma "Stage/*", 60×58), e.g. in "How it grows" and the lessons hub. */
export function StageIcon({
  stage,
  outline,
  className,
}: {
  stage: GrowthStageId;
  outline?: boolean;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 60 58" className={cn('h-auto w-full', className)} aria-hidden>
      <StageArt stage={stage} outline={outline} />
    </svg>
  );
}
