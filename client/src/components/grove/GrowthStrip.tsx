import { GROWTH_STAGES, type GrowthStageId } from '@btree/shared';
import { cn } from '../ui/cn';
import { StageIcon } from './StageArt';

/** "How it grows": every stage, the current one highlighted, future ones as dashed outlines. */
export function GrowthStrip({ stage }: { stage: GrowthStageId }) {
  const current = GROWTH_STAGES.findIndex((s) => s.id === stage);
  return (
    <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {GROWTH_STAGES.map((s, i) => (
        <li
          key={s.id}
          className={cn(
            'text-small rounded-lg px-2 pt-2.5 pb-3 text-center font-bold',
            i === current && 'bg-highlight text-on-highlight',
            i > current && 'text-ink-muted',
          )}
          aria-current={i === current ? 'step' : undefined}
        >
          <StageIcon stage={s.id} outline={i > current} className="mx-auto mb-1 max-w-[60px]" />
          <span className="block">{s.label}</span>
          <span className="block font-normal">
            {s.minModules === 0
              ? 'Day one'
              : `${s.minModules} module${s.minModules === 1 ? '' : 's'}`}
          </span>
        </li>
      ))}
    </ol>
  );
}
