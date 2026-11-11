/** The leaf used for the logo, the leaves currency and list bullets. */
export function LeafIcon({
  className = 'h-5 w-5',
  title,
  color = 'var(--leaf)',
}: {
  className?: string;
  title?: string;
  /** Leaf colour; pass `currentColor` on a green button. */
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <path d="M12 2C6 7 5.5 15 12 22c6.5-7 6-15 0-20z" fill={color} />
      <path d="M12 6v14" stroke="var(--hill-1)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
