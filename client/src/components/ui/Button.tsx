import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router';
import { cn } from './cn';

type Variant = 'primary' | 'outline' | 'accent' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-display transition-transform active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary: 'bg-leaf text-on-leaf shadow-press-leaf',
  outline: 'border-2 border-ink bg-transparent text-ink',
  accent: 'bg-highlight text-on-highlight shadow-press-highlight',
  ghost: 'bg-paper text-ink shadow-paper-stack-sm font-sans font-bold',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-label',
  md: 'px-5 py-2.5 text-button',
  lg: 'px-6 py-3 text-button',
};

const buttonClass = (variant: Variant = 'primary', size: Size = 'md', className?: string) =>
  cn(base, variants[variant], sizes[size], className);

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant, size, className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...rest
}: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}
