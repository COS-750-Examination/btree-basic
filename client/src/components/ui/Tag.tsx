import type { HTMLAttributes } from 'react';
import { cn } from './cn';

/**
 * Small tilted label, e.g. "COS212 · Pre-lecture prep" or "Module 6 check". `spot` is Figma's
 * dashed Tag/Locked style, for something that is not unlocked yet.
 */
export function Tag({
  tone = 'accent',
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: 'accent' | 'surface' | 'spot' }) {
  return (
    <span
      className={cn(
        'shadow-paper-stack-sm text-small inline-block -rotate-1 rounded-sm px-2.5 py-1 font-bold',
        tone === 'accent' && 'bg-highlight text-on-highlight',
        tone === 'surface' && 'bg-paper text-ink',
        tone === 'spot' && 'bg-paper text-ink border-ink-muted border-2 border-dashed',
        className,
      )}
      {...rest}
    />
  );
}
