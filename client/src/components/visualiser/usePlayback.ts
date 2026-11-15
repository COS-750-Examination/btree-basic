import { useEffect } from 'react';

/** Time on each step when the voice is off, at 1x speed. Long enough to read the note and watch the move settle. */
export const BASE_DELAY_MS = 5000;
/** Breathing room after the narration ends, before the next step starts. */
export const AFTER_SPEECH_MS = 1000;

export function usePlayback(
  playing: boolean,
  speed: number,
  next: () => void,
  { step, voice = false, spoken = true }: { step: number; voice?: boolean; spoken?: boolean },
) {
  useEffect(() => {
    if (!playing || !spoken) return;
    const id = window.setTimeout(next, voice ? AFTER_SPEECH_MS : BASE_DELAY_MS / speed);
    return () => window.clearTimeout(id);
  }, [playing, speed, next, step, voice, spoken]);
}
