import { Volume2, VolumeX } from 'lucide-react';
import { useEffect } from 'react';
import { speak, speechSupported, stopSpeaking } from '../../lib/speech';
import { Card, LeafIcon } from '../ui';

/** Plain-language sentence for the current step (FR4), optionally read aloud. */
export function NarrationBar({
  text,
  voice,
  onVoice,
}: {
  text: string;
  voice: boolean;
  onVoice: (v: boolean) => void;
}) {
  useEffect(() => {
    if (voice) speak(text);
  }, [text, voice]);
  useEffect(() => () => stopSpeaking(), []);

  return (
    <Card className="flex items-center gap-3 py-4">
      <LeafIcon className="h-6 w-6 shrink-0" />
      <p className="flex-1 text-lg" aria-live="polite">
        {text}
      </p>
      {speechSupported() && (
        <button
          type="button"
          onClick={() => onVoice(!voice)}
          aria-pressed={voice}
          aria-label={voice ? 'Turn narration voice off' : 'Read steps aloud'}
          className="bg-sunken grid h-9 w-9 place-items-center rounded-full"
        >
          {voice ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>
      )}
    </Card>
  );
}
