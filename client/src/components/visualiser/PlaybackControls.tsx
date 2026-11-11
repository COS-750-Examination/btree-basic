import { ChevronLeft, Pause, Play, RotateCcw } from 'lucide-react';
import { Button } from '../ui';

/** Restart, back, play/pause, next and speed (FR3). Keyboard: buttons are native and focusable. */
export function PlaybackControls({
  playing,
  canPrev,
  canNext,
  speed,
  onRestart,
  onPrev,
  onTogglePlay,
  onNext,
  onSpeed,
}: {
  playing: boolean;
  canPrev: boolean;
  canNext: boolean;
  speed: number;
  onRestart: () => void;
  onPrev: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onSpeed: (s: number) => void;
}) {
  const round =
    'grid h-11 w-11 place-items-center rounded-pill bg-paper shadow-paper-stack-sm disabled:opacity-40';
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        className={round}
        onClick={onRestart}
        aria-label="Restart"
        disabled={!canPrev}
      >
        <RotateCcw className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={round}
        onClick={onPrev}
        aria-label="Previous step"
        disabled={!canPrev}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onTogglePlay}
        aria-label={playing ? 'Pause' : 'Play'}
        disabled={!canNext && !playing}
        className="bg-leaf text-on-leaf shadow-press-leaf rounded-pill grid h-12 w-12 place-items-center disabled:opacity-40"
      >
        {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </button>
      <Button variant="accent" onClick={onNext} disabled={!canNext}>
        Next step
      </Button>
      <label className="text-label ml-auto flex items-center gap-3 font-bold">
        Speed
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.25}
          value={speed}
          onChange={(e) => onSpeed(Number(e.target.value))}
          className="w-28 accent-[var(--leaf)]"
          aria-valuetext={`${speed}x`}
        />
      </label>
    </div>
  );
}
