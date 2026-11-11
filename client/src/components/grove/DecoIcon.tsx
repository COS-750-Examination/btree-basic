import type { DecorationId } from '@btree/shared';
import type { ReactNode } from 'react';
import { cn } from '../ui/cn';

/* Decoration icons from the Figma Components page (DecoIcon/*, 28×28), with colours as tokens. */
const ICONS: Record<DecorationId, ReactNode> = {
  apples: (
    <>
      <circle cx="14" cy="16" r="10" fill="var(--apple)" />
      <path d="M14 6V3" stroke="var(--branch)" strokeWidth="2" strokeLinecap="round" />
      <path d="M15 5C18 1 23 2 23 4C20 6 17 6 15 5Z" fill="var(--leaf)" />
    </>
  ),
  blossoms: (
    <>
      <g fill="var(--blossom)">
        <circle cx="14" cy="7" r="5" />
        <circle cx="21" cy="12" r="5" />
        <circle cx="18" cy="20" r="5" />
        <circle cx="10" cy="20" r="5" />
        <circle cx="7" cy="12" r="5" />
      </g>
      <circle cx="14" cy="14" r="3.5" fill="var(--sun)" />
    </>
  ),
  songbird: (
    <g fill="var(--coral)">
      <path d="M8 16L1 12L2 20L8 16Z" />
      <ellipse cx="13" cy="16" rx="8" ry="7" />
      <circle cx="20" cy="9" r="5.5" />
      <path d="M25 8L28 10L25 11V8Z" fill="var(--sun)" />
    </g>
  ),
  bunting: (
    <>
      <path d="M1 7C9.667 12.333 18.333 12.333 27 7" stroke="var(--ink)" strokeWidth="1.2" />
      <path d="M3 8H10L6.5 17L3 8Z" fill="var(--coral)" />
      <path d="M11 11H18L14.5 20L11 11Z" fill="var(--highlight)" />
      <path d="M19 8H26L22.5 17L19 8Z" fill="var(--bunting-blue)" />
    </>
  ),
  butterflies: (
    <>
      <ellipse cx="9" cy="11" rx="7" ry="6" fill="var(--bunting-blue)" />
      <ellipse cx="19" cy="11" rx="7" ry="6" fill="var(--bunting-blue)" />
      <ellipse cx="10" cy="20" rx="4.5" ry="4" fill="var(--highlight)" />
      <ellipse cx="18" cy="20" rx="4.5" ry="4" fill="var(--highlight)" />
      <rect x="13" y="7" width="2" height="16" rx="1" fill="var(--ink)" />
    </>
  ),
  lanterns: (
    <>
      <path
        d="M1.167 4.667C9.722 8.556 18.278 8.556 26.833 4.667"
        stroke="var(--branch-dark)"
        strokeWidth="1.633"
      />
      <path d="M8.167 7.583V10.5M19.833 7.583V10.5" stroke="var(--branch-dark)" strokeWidth="1.4" />
      <rect x="4.083" y="10.5" width="8.167" height="11.667" rx="3.5" fill="var(--coral)" />
      <rect x="15.75" y="10.5" width="8.167" height="11.667" rx="3.5" fill="var(--highlight)" />
      <g fill="var(--branch-dark)">
        <rect x="5.833" y="9.567" width="4.667" height="2.1" rx="0.7" />
        <rect x="17.5" y="9.567" width="4.667" height="2.1" rx="0.7" />
        <rect x="5.833" y="21.467" width="4.667" height="2.1" rx="0.7" />
        <rect x="17.5" y="21.467" width="4.667" height="2.1" rx="0.7" />
      </g>
      <circle cx="8.167" cy="16.333" r="1.867" fill="var(--sun)" />
      <circle cx="19.833" cy="16.333" r="1.867" fill="var(--sun)" />
    </>
  ),
  'fairy-lights': (
    <>
      <path
        d="M1 8C5 13.333 9.333 14 14 10C18.667 6 23 6 27 10"
        stroke="var(--ink)"
        strokeWidth="1.2"
      />
      <g fill="var(--sun)">
        <circle cx="5" cy="13" r="3" />
        <circle cx="14" cy="12" r="3" />
        <circle cx="22" cy="10" r="3" />
      </g>
    </>
  ),
  'bird-box': (
    <>
      <path d="M4 12L14 3L24 12V26H4V12Z" fill="var(--branch)" />
      <circle cx="14" cy="15" r="3.5" fill="var(--ink)" />
    </>
  ),
  'tree-swing': (
    <>
      <path d="M8 1V18M20 1V18" stroke="var(--ink-muted)" strokeWidth="1.8" />
      <rect x="5" y="18" width="18" height="5" rx="2" fill="var(--ink-muted)" />
    </>
  ),
};

/** A decoration's icon as an SVG group in a 28×28 box, for reuse inside larger scenes. */
export function DecoArt({ id }: { id: DecorationId }) {
  return <>{ICONS[id]}</>;
}

/** A decoration's icon (Figma DecoIcon/*), e.g. in the craft drawer and a friend's grove. */
export function DecoIcon({ id, className }: { id: DecorationId; className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" className={cn('h-7 w-7', className)} aria-hidden>
      <DecoArt id={id} />
    </svg>
  );
}
