import type { ObjectiveMastery } from '@btree/shared';
import { cn } from './cn';

const STYLE: Record<ObjectiveMastery['status'], [string, string]> = {
  mastered: ['Mastered', 'bg-paper shadow-paper-stack-sm'],
  'getting-there': ['Getting there', 'bg-highlight text-on-highlight'],
  'not-started': ['Not started', 'border-2 border-dashed border-ink'],
};

export function StatusBadge({ status }: { status: ObjectiveMastery['status'] }) {
  const [label, style] = STYLE[status];
  return (
    <span
      className={cn(
        'text-small inline-block rounded-sm px-2 py-1 font-bold whitespace-nowrap',
        style,
      )}
    >
      {label}
    </span>
  );
}
