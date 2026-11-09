import type { Trace } from '@btree/engine';
import { useCallback, useState } from 'react';
import { narrate } from '../../lib/narration';
import { stepView } from '../../lib/stepView';
import { BTreeView } from '../tree/BTreeView';
import { NarrationBar } from './NarrationBar';
import { PlaybackControls } from './PlaybackControls';
import { usePlayback } from './usePlayback';

/** Self-contained animated worked example for lessons ("Watch" tab) and practice help. */
export function TracePlayer({ trace, autoPlay = false }: { trace: Trace; autoPlay?: boolean }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState(1);
  const [voice, setVoice] = useState(false);
  const last = trace.steps.length - 1;

  const next = useCallback(() => {
    setIndex((i) => {
      if (i >= last) {
        setPlaying(false);
        return i;
      }
      return i + 1;
    });
  }, [last]);
  usePlayback(playing, speed, next);

  const step = trace.steps[index]!;
  return (
    <div className="space-y-4">
      <div className="bg-sky rounded-xl p-2">
        <BTreeView
          {...stepView(trace, index)}
          scene
          label={`Step ${index + 1} of ${trace.steps.length}: ${narrate(step)}`}
        />
      </div>
      <NarrationBar text={narrate(step)} voice={voice} onVoice={setVoice} />
      <PlaybackControls
        playing={playing}
        canPrev={index > 0}
        canNext={index < last}
        speed={speed}
        onRestart={() => {
          setIndex(0);
          setPlaying(false);
        }}
        onPrev={() => {
          setIndex((i) => Math.max(0, i - 1));
          setPlaying(false);
        }}
        onTogglePlay={() => setPlaying((p) => !p)}
        onNext={next}
        onSpeed={setSpeed}
      />
    </div>
  );
}
