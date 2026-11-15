import { useEffect } from 'react';

const BASE_DELAY_MS = 1400;
export const AFTER_SPEECH_MS = 350;

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
