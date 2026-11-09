import type { Step, StepPhase } from '@btree/engine';
import { Card, CardTitle, LeafIcon, cn } from '../ui';

const PHASE_LABEL: Record<StepPhase, (key: number) => string> = {
  find: () => 'Find the leaf',
  place: (k) => `Add ${k} in order`,
  split: () => 'Split the full node',
  promote: () => 'Move the middle key up',
  remove: (k) => `Remove ${k}`,
  rebalance: () => 'Borrow or merge',
  finish: () => 'Done',
};

/** Coarse phases of the current trace ("Steps" panel), ticking off as the animation passes them. */
export function StepsPanel({
  steps,
  index,
  keyValue,
}: {
  steps: Step[];
  index: number;
  keyValue: number;
}) {
  const phases: { phase: StepPhase; first: number }[] = [];
  steps.forEach((s, i) => {
    if (phases.at(-1)?.phase !== s.phase) phases.push({ phase: s.phase, first: i });
  });
  return (
    <Card>
      <CardTitle>Steps</CardTitle>
      {phases.length === 0 ? (
        <p className="text-muted text-sm">Run an operation to see its steps.</p>
      ) : (
        <ol className="space-y-2 text-sm">
          {phases.map((p, i) => {
            const reached = index >= p.first;
            const active = reached && (phases[i + 1] === undefined || index < phases[i + 1]!.first);
            return (
              <li
                key={`${p.phase}-${p.first}`}
                className={cn(
                  'flex items-center gap-2',
                  !reached && 'text-muted',
                  active && 'font-bold',
                )}
              >
                {reached ? (
                  <LeafIcon className="h-4 w-4" />
                ) : (
                  <span className="border-muted h-4 w-4 rounded-full border-2" aria-hidden />
                )}
                {PHASE_LABEL[p.phase](keyValue)}
                {active && <span className="sr-only">(current)</span>}
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
