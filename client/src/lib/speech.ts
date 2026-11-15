/** Optional narration through the browser's Web Speech API (Aural in VARK). No network or package needed. */
export const speechSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

const live = new Set<SpeechSynthesisUtterance>();

export function speak(text: string, rate = 1, onEnd?: () => void): void {
  if (!speechSupported()) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-ZA';
  u.rate = rate;
  const end = () => {
    live.delete(u);
    onEnd?.();
  };
  u.onend = end;
  u.onerror = end;
  live.add(u);
  window.speechSynthesis.speak(u);
}

export function speechEstimateMs(text: string, rate = 1): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return (words * 60_000) / 140 / rate + 2000;
}

export function stopSpeaking(): void {
  live.clear();
  if (speechSupported()) window.speechSynthesis.cancel();
}

/** Strips Markdown syntax so it reads naturally aloud. */
export const plainText = (md: string) =>
  md
    .replace(/[#>*_`|]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/-{3,}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
