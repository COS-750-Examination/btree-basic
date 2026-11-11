import { Card, CardTitle, cn } from '../ui';

const TITLES = ['Nudge', 'The rule', 'Worked example'];

/**
 * Tiered hints (FR8): one at a time, each unlocked by a wrong answer or by asking.
 * Hints are free; a hinted answer still earns feedback but counts as practice.
 */
export function HintLadder({
  hints,
  shown,
  canReveal,
  onReveal,
  onTryAgain,
}: {
  hints: string[];
  shown: number;
  canReveal: boolean;
  onReveal: () => void;
  onTryAgain?: () => void;
}) {
  if (hints.length === 0) return null;
  return (
    <Card>
      <CardTitle>Hints</CardTitle>
      <p className="text-ink-muted text-small mb-3">
        Hints are free, and every hint you read still earns +5 leaves.
      </p>
      <ol className="space-y-3" aria-live="polite">
        {hints.map((hint, i) =>
          i < shown ? (
            <li
              key={i}
              className="bg-highlight text-on-highlight shadow-press-highlight rounded-lg p-4"
            >
              <p className="font-display text-small">
                Hint {i + 1} · {TITLES[i] ?? 'Hint'}
              </p>
              <p className="text-small mt-1">{hint}</p>
              {i === shown - 1 && onTryAgain && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onTryAgain}
                    className="bg-leaf font-display text-on-leaf shadow-press-leaf text-small rounded-md px-4 py-2"
                  >
                    Try again
                  </button>
                  {i < hints.length - 1 && (
                    <button
                      type="button"
                      onClick={onReveal}
                      disabled={!canReveal}
                      className="font-display text-small rounded-md border-2 border-current px-4 py-2 disabled:opacity-40"
                    >
                      Next hint
                    </button>
                  )}
                </div>
              )}
            </li>
          ) : (
            <li
              key={i}
              className={cn('text-small flex items-center gap-3', i > shown && 'text-ink-muted')}
            >
              <span
                className={cn(
                  'rounded-sm border-2 border-dashed px-2 py-1 font-bold',
                  i > shown ? 'border-ink-muted' : 'border-ink',
                )}
              >
                Hint {i + 1} · {TITLES[i] ?? 'Hint'}
              </span>
              {i === shown ? (
                <button
                  type="button"
                  onClick={onReveal}
                  disabled={!canReveal}
                  className="font-bold underline disabled:no-underline disabled:opacity-60"
                >
                  {canReveal ? 'Show hint' : 'Unlocks after another try'}
                </button>
              ) : (
                <span>Locked</span>
              )}
            </li>
          ),
        )}
      </ol>
    </Card>
  );
}
