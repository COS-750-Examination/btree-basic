import type { HTMLAttributes } from 'react';
import { cn } from './cn';

type Tone = 'surface' | 'accent' | 'sunken';

const tones: Record<Tone, string> = {
  surface: 'bg-paper',
  accent: 'bg-highlight text-on-highlight',
  sunken: 'bg-sky-100',
};

/** Cream "paper" card with the hard offset shadow used across every screen. */
export function Card({
  tone = 'surface',
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { tone?: Tone }) {
  return (
    <div className={cn('shadow-paper-stack rounded-lg p-5', tones[tone], className)} {...rest} />
  );
}

export function CardTitle({ className, children, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn('text-heading mb-2', className)} {...rest}>
      {children}
    </h2>
  );
}
