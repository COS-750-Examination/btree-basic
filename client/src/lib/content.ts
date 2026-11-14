import { LessonMeta, QuizFile, QuizItem, TreeSpec } from '@btree/shared';
import { z } from 'zod';
import lessonIndex from '../content/lessons/index.json';
import presetsRaw from '../content/presets.json';
import warmupRaw from '../content/warmup.json';

/*
 * Content lives in src/content as JSON and Markdown so the ID team can edit it without
 * touching components (NFR10). Everything is validated here, so a malformed file fails
 * loudly at start-up instead of silently rendering wrong.
 */

export const lessons = z.array(LessonMeta).parse(lessonIndex);

const markdown = import.meta.glob('../content/lessons/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export function lessonMarkdown(file: string): string {
  return markdown[`../content/lessons/${file}`] ?? `_Missing lesson file: ${file}_`;
}

export const lessonFor = (moduleId: number) => lessons.find((l) => l.moduleId === moduleId);

const miniLessons = import.meta.glob('../content/mini-lessons/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export const miniLesson = (objective: string): string | undefined =>
  miniLessons[`../content/mini-lessons/${objective}.md`];

const quizFiles = import.meta.glob('../content/quizzes/*.json', { import: 'default', eager: true });
export const quizzes = Object.values(quizFiles)
  .map((q) => QuizFile.parse(q))
  .sort((a, b) => a.moduleId - b.moduleId);
export const quizFor = (moduleId: number) => quizzes.find((q) => q.moduleId === moduleId);

export const Preset = z.object({
  id: z.string(),
  label: z.string(),
  order: z.number().int().min(3).max(7),
  operation: z.enum(['search', 'insert', 'delete']),
  key: z.number(),
  tree: TreeSpec.nullable(),
});
export type Preset = z.infer<typeof Preset>;
export const presets = z.array(Preset).parse(presetsRaw);

export const warmup = z
  .object({ intro: z.string(), items: z.array(QuizItem).min(1) })
  .parse(warmupRaw);
