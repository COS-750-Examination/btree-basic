/** Wavy green hills under the header. Decorative only. */
export function HillBand() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 60"
      preserveAspectRatio="none"
      className="block h-8 w-full sm:h-12"
    >
      <path d="M0 30 C 240 10, 480 10, 720 22 S 1200 40, 1440 8 V60 H0 Z" fill="var(--hill-1)" />
      <path d="M0 42 C 300 28, 600 30, 900 38 S 1300 36, 1440 30 V60 H0 Z" fill="var(--hill-2)" />
    </svg>
  );
}
