import type { CSSProperties } from 'react';

/** Delays a `.rise` entrance by `i` steps, so lists cascade in instead of popping in at once. */
export const stagger = (i: number) => ({ '--i': i }) as CSSProperties;
