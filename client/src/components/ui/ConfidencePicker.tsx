import type { Confidence } from '@btree/shared';
import { cn } from './cn';

const LABELS: Record<Confidence, string> = {
  guessing: 'Guessing',
  'fairly-sure': 'Fairly sure',
  certain: 'Certain',
};

/** "How sure are you?" — confidence is stored with the attempt; it never changes the score. */
export function ConfidencePicker({
  value,
  onChange,
}: {
  value?: Confidence;
  onChange: (c: Confidence) => void;
}) {
  return (
    <fieldset className="text-small flex flex-wrap items-center gap-2">
      <legend className="float-left mr-2 font-bold">How sure are you?</legend>
      {(Object.keys(LABELS) as Confidence[]).map((c) => (
        <label
          key={c}
          className={cn(
            'shadow-paper-stack-sm has-[:focus-visible]:outline-yarn text-small cursor-pointer rounded-sm px-2.5 py-1 font-bold has-[:focus-visible]:outline-2',
            value === c ? 'bg-highlight text-on-highlight' : 'bg-paper',
          )}
        >
          <input
            type="radio"
            name="confidence"
            className="sr-only"
            checked={value === c}
            onChange={() => onChange(c)}
          />
          {LABELS[c]}
        </label>
      ))}
    </fieldset>
  );
}
