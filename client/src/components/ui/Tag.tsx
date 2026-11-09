import type { HTMLAttributes } from 'react';
import { cn } from './cn';

/** Small tilted label, e.g. "COS212 · Pre-lecture prep" or "Module 6 check". */
export function Tag({
  tone = 'accent',
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: 'accent' | 'surface' }) {
  return (
    <span
      className={cn(
        'shadow-offset-sm inline-block -rotate-1 rounded-md px-2.5 py-1 text-xs font-bold',
        tone === 'accent' ? 'bg-accent text-on-accent' : 'bg-surface text-ink',
        className,
      )}
      {...rest}
    />
  );
}
