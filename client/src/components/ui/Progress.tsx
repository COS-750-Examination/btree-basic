import { cn } from './cn';

/** Segmented progress ("Question 2 of 5"): done = primary, current = accent outline, rest = track. */
export function ProgressSegments({
  total,
  done,
  current,
  label,
  className,
}: {
  total: number;
  done: number;
  current?: number;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      className={cn('flex gap-1.5', className)}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            'rounded-pill h-2 flex-1',
            i < done
              ? 'bg-leaf'
              : i === current
                ? 'border-ink bg-highlight border-2'
                : 'bg-sky-100',
          )}
        />
      ))}
    </div>
  );
}

export function ProgressBar({
  value,
  label,
  tone = 'primary',
  className,
}: {
  value: number;
  label: string;
  tone?: 'primary' | 'warn';
  className?: string;
}) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cn('rounded-pill h-2.5 w-full bg-sky-100', className)}
    >
      <div
        className={cn('rounded-pill h-full', tone === 'primary' ? 'bg-leaf' : 'bg-yarn')}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
