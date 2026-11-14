import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useProgressStore } from '../../stores/progressStore';
import { LeafIcon } from '../ui';

const MESSAGE = {
  streak: '3-day practice streak!',
  readyCheck: "You're ready for the lecture!",
} as const;

/** How long a bonus message stays before it closes itself. */
export const TOAST_MS = 6000;

/** A short message when the server pays a bonus, so the jump in leaves makes sense. */
export function RewardToast() {
  const bonus = useProgressStore((s) => s.lastBonus);
  const dismiss = useProgressStore((s) => s.dismissBonus);

  useEffect(() => {
    if (!bonus) return;
    const t = setTimeout(dismiss, TOAST_MS);
    return () => clearTimeout(t);
  }, [bonus, dismiss]);

  return (
    // Always mounted, so screen readers announce the message when it appears.
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4"
    >
      {bonus && (
        <div className="bg-highlight text-on-highlight shadow-paper-stack pointer-events-auto flex items-center gap-3 rounded-lg px-4 py-3">
          <LeafIcon className="h-5 w-5 shrink-0" />
          <p className="font-bold">
            +{bonus.amount} leaves: {MESSAGE[bonus.reason]}
          </p>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close"
            className="rounded-sm p-1 hover:bg-white/30"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
