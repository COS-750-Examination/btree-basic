import { cn } from './cn';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export function Avatar({
  name,
  size = 'md',
  tone = 'bg-highlight text-on-highlight',
  className,
}: {
  name: string;
  size?: 'md' | 'lg';
  tone?: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'font-display rounded-pill inline-flex shrink-0 items-center justify-center',
        tone,
        size === 'md' ? 'text-small h-8 w-8' : 'border-ink text-body h-14 w-14 border-2',
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
