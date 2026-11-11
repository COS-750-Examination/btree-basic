import { PSEUDOCODE, type Operation } from '@btree/engine';
import { Card, CardTitle, cn } from '../ui';

/** Pseudocode with the current line highlighted (FR4). Plain and Java lines are aligned. */
export function PseudocodePanel({
  operation,
  line,
  language,
  onLanguage,
  note,
}: {
  operation: Operation;
  line: number | null;
  language: 'plain' | 'java';
  onLanguage: (l: 'plain' | 'java') => void;
  note?: string;
}) {
  const lines = PSEUDOCODE[operation][language];
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <CardTitle className="mb-0">Pseudocode</CardTitle>
        <div role="group" aria-label="Pseudocode language" className="flex gap-1">
          {(['plain', 'java'] as const).map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={language === l}
              onClick={() => onLanguage(l)}
              className={cn(
                'shadow-paper-stack-sm text-small rounded-sm px-2 py-1 font-bold',
                language === l ? 'bg-highlight text-on-highlight' : 'bg-paper',
              )}
            >
              {l === 'plain' ? 'Plain' : 'Java'}
            </button>
          ))}
        </div>
      </div>
      <ol className="overflow-x-auto font-mono text-[13px] leading-7">
        {lines.map((text, i) => {
          const active = line === i + 1;
          return (
            <li
              key={i}
              aria-current={active ? 'step' : undefined}
              className={cn(
                'flex gap-3 rounded-sm px-1 whitespace-pre-wrap',
                active && 'bg-highlight text-on-highlight',
              )}
            >
              <span className="text-ink-muted w-5 shrink-0 text-right" aria-hidden>
                {active ? '▶' : i + 1}
              </span>
              <span>{text}</span>
            </li>
          );
        })}
      </ol>
      {note && <p className="text-ink-muted text-small mt-2 font-mono">{note}</p>}
    </Card>
  );
}
