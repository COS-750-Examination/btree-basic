import type { ObjectiveId } from '@btree/shared';

export const MINI_LESSON_LINKS: Record<
  ObjectiveId,
  { module: number; practice?: { to: string; label: string } }
> = {
  O1: { module: 4 },
  O2: { module: 4, practice: { to: '/practice/valid-or-not', label: 'Valid or not?' } },
  O3: {
    module: 5,
    practice: { to: '/practice/predict-search-path', label: 'Predict the search path' },
  },
  O4: { module: 6, practice: { to: '/practice/where-does-it-go', label: 'Where does it go?' } },
  O5: { module: 6, practice: { to: '/practice/split-it-yourself', label: 'Split it yourself' } },
  O6: { module: 6 },
  O7: { module: 8 },
  O8: { module: 7 },
};

export const miniLessonPath = (objective: ObjectiveId, from?: string) =>
  `/mini-lessons/${objective}${from ? `?from=${encodeURIComponent(from)}` : ''}`;

export function splitAnswer(md: string): { body: string; answer: string | null } {
  const at = md.indexOf('## Answer');
  if (at < 0) return { body: md, answer: null };
  return { body: md.slice(0, at), answer: md.slice(at + '## Answer'.length).trim() };
}
