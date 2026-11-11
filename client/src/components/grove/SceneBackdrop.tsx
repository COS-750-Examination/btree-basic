import type { ReactNode } from 'react';
import { useThemeStore } from '../../stores/themeStore';
import { cn } from '../ui/cn';

/** Sky, sun or moon, clouds/stars and three rolling hills. Children are drawn on top. */
export function SceneBackdrop({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  const dusk = useThemeStore((s) => s.theme) === 'dusk';
  return (
    <div
      className={cn('shadow-paper-stack relative overflow-hidden rounded-lg bg-sky-200', className)}
    >
      <svg
        aria-hidden
        viewBox="0 0 800 450"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 h-full w-full"
      >
        {dusk ? (
          <>
            <circle cx="640" cy="90" r="48" fill="var(--sun)" />
            <circle cx="662" cy="74" r="44" fill="var(--sky-200)" />
            {[
              [120, 80],
              [260, 150],
              [420, 60],
              [560, 190],
              [720, 220],
              [80, 230],
              [350, 210],
            ].map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="var(--sun)" />
            ))}
          </>
        ) : (
          <circle cx="640" cy="90" r="46" fill="var(--sun)" />
        )}
        <g fill="var(--cloud)" opacity={dusk ? 0.8 : 0.95}>
          <ellipse cx="160" cy="80" rx="70" ry="20" />
          <ellipse cx="200" cy="66" rx="44" ry="20" />
          <ellipse cx="520" cy="130" rx="54" ry="16" />
        </g>
        <path d="M0 300 C 200 250, 420 260, 800 280 V450 H0 Z" fill="var(--hill-1)" />
        <path d="M0 350 C 260 310, 520 330, 800 320 V450 H0 Z" fill="var(--hill-2)" />
        <path d="M0 400 C 300 380, 560 390, 800 385 V450 H0 Z" fill="var(--hill-3)" />
      </svg>
      <div className="relative">{children}</div>
    </div>
  );
}
