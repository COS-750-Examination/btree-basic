/** Optional narration through the browser's Web Speech API (Aural in VARK). No network or package needed. */
export const speechSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export function speak(text: string, rate = 1): void {
  if (!speechSupported()) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-ZA';
  u.rate = rate;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking(): void {
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
