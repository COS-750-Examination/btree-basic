import { useEffect } from 'react';

const BASE_DELAY_MS = 1400;

/** Advances `next` on a timer while `playing`; delay scales with `speed`. */
export function usePlayback(
  playing: boolean,
  speed: number,
  next: () => void,
  deps: unknown[] = [],
) {
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(next, BASE_DELAY_MS / speed);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed, next, ...deps]);
}
