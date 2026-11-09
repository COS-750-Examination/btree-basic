import type { HTMLAttributes } from 'react';
import { cn } from './cn';

type Tone = 'surface' | 'accent' | 'sunken';

const tones: Record<Tone, string> = {
  surface: 'bg-surface',
  accent: 'bg-accent text-on-accent',
  sunken: 'bg-sunken',
};

/** Cream "paper" card with the hard offset shadow used across every screen. */
export function Card({
  tone = 'surface',
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { tone?: Tone }) {
  return <div className={cn('shadow-offset rounded-xl p-5', tones[tone], className)} {...rest} />;
}

export function CardTitle({ className, children, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn('mb-2 text-xl', className)} {...rest}>
      {children}
    </h2>
  );
}
