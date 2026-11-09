import { GROWTH_STAGES, type GrowthStageId } from '@btree/shared';
import { cn } from '../ui/cn';
import { GroveTree } from './GroveTree';

/** "How it grows": every stage, current one highlighted, future ones dashed. */
export function GrowthStrip({ stage }: { stage: GrowthStageId }) {
  const current = GROWTH_STAGES.findIndex((s) => s.id === stage);
  return (
    <ol className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {GROWTH_STAGES.map((s, i) => (
        <li
          key={s.id}
          className={cn(
            'rounded-xl p-2 text-center text-xs font-bold',
            i === current && 'bg-accent text-on-accent',
            i > current && 'text-muted [&_svg]:opacity-40 [&_svg]:grayscale',
          )}
          aria-current={i === current ? 'step' : undefined}
        >
          <GroveTree stage={s.id} />
          <span>{s.label}</span>
          <span className="block font-normal">{s.minModules} modules</span>
        </li>
      ))}
    </ol>
  );
}
