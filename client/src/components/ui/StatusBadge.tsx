import type { ObjectiveMastery } from '@btree/shared';
import { cn } from './cn';

const STYLE: Record<ObjectiveMastery['status'], [string, string]> = {
  mastered: ['Mastered', 'bg-surface shadow-offset-sm'],
  'getting-there': ['Getting there', 'bg-accent text-on-accent'],
  'not-started': ['Not started', 'border-2 border-dashed border-line'],
};

export function StatusBadge({ status }: { status: ObjectiveMastery['status'] }) {
  const [label, style] = STYLE[status];
  return (
    <span
      className={cn('inline-block rounded-md px-2 py-1 text-xs font-bold whitespace-nowrap', style)}
    >
      {label}
    </span>
  );
}
