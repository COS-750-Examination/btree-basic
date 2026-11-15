import { useEffect, useState } from 'react';
import { speak, speechEstimateMs, stopSpeaking } from '../../lib/speech';

export function useNarration(text: string, step: number, voice: boolean, rate: number): boolean {
  const key = `${step}|${text}`;
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (!voice) {
      stopSpeaking();
      return;
    }
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      setDone(key);
    };
    speak(text, rate, finish);
    const fallback = window.setTimeout(finish, speechEstimateMs(text, rate));
    return () => {
      settled = true;
      window.clearTimeout(fallback);
    };
  }, [key, text, voice, rate]);

  useEffect(() => () => stopSpeaking(), []);

  return !voice || done === key;
}
