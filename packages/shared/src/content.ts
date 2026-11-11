import { z } from 'zod';
import { ObjectiveIdSchema } from './api';
import { MODULES } from './constants';

/**
 * Schemas for the content files in client/src/content (owned by the ID lead).
 * Content is validated at load so a typo in a JSON file fails loudly in development.
 */

/** Literal tree shape, matching `NodeSpec` in @btree/engine. */
export interface TreeSpec {
  keys: number[];
  children?: TreeSpec[];
}
export const TreeSpec: z.ZodType<TreeSpec> = z.lazy(() =>
  z.object({ keys: z.array(z.number()), children: z.array(TreeSpec).optional() }),
);

const Option = z.object({
  id: z.string(),
  text: z.string(),
  correct: z.boolean().default(false),
  /** Explains why this option is right or wrong (elaborated feedback, FR6). */
  feedback: z.string(),
  /** Tag of the misconception a wrong option reveals, e.g. "promote-new-key". */
  misconception: z.string().optional(),
});

const Base = z.object({
  id: z.string(),
  objective: ObjectiveIdSchema,
  prompt: z.string(),
  /** Up to three tiered hints: nudge, rule, worked example (FR8). */
  hints: z.array(z.string()).max(3).default([]),
  order: z.number().int().min(3).max(7).optional(),
  tree: TreeSpec.optional(),
});

export const QuizItem = z.discriminatedUnion('type', [
  Base.extend({ type: z.literal('mcq'), options: z.array(Option).min(2) }),
  Base.extend({ type: z.literal('bst-mcq'), options: z.array(Option).min(2) }),
  /** Student clicks nodes in visiting order. */
  Base.extend({
    type: z.literal('trace-path'),
    searchKey: z.number(),
    answerPath: z.array(z.array(z.number())),
  }),
  /** Student picks the key promoted when the node overflows. */
  Base.extend({ type: z.literal('pick-median'), insertKey: z.number(), answer: z.number() }),
  /** Student predicts the tree after an operation. */
  Base.extend({
    type: z.literal('predict-tree'),
    insertKey: z.number(),
    options: z.array(Option).min(2),
  }),
  /** Student decides whether a tree is valid and names the broken rule (O2). */
  Base.extend({
    type: z.literal('valid-or-not'),
    valid: z.boolean(),
    brokenRule: z.string().optional(),
  }),
]);
export type QuizItem = z.infer<typeof QuizItem>;

export const QuizFile = z.object({
  moduleId: z.number().int().min(1).max(MODULES.length),
  title: z.string(),
  items: z.array(QuizItem).min(1),
});
export type QuizFile = z.infer<typeof QuizFile>;

export const LessonPart = z.object({
  id: z.string(),
  title: z.string(),
  /** Markdown file name in content/lessons. */
  file: z.string(),
});

export const LessonMeta = z.object({
  moduleId: z.number().int().min(1).max(MODULES.length),
  headline: z.string(),
  objectives: z.array(ObjectiveIdSchema),
  parts: z.array(LessonPart).min(1),
});
export type LessonMeta = z.infer<typeof LessonMeta>;

/** Narration templates keyed by engine `Step.narration`; `{key}` placeholders are filled from `Step.params`. */
export const NarrationFile = z.record(z.string(), z.string());
export type NarrationFile = z.infer<typeof NarrationFile>;
