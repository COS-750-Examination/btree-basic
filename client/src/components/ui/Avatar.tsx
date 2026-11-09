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
  className,
}: {
  name: string;
  size?: 'md' | 'lg';
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'bg-accent font-display text-on-accent inline-flex shrink-0 items-center justify-center rounded-full',
        size === 'md' ? 'h-8 w-8 text-xs' : 'border-line h-14 w-14 border-2 text-lg',
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
