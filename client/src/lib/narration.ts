import type { Step } from '@btree/engine';
import { NarrationFile } from '@btree/shared';
import raw from '../content/narration.json';

const templates = NarrationFile.parse(raw);

/** Turns an engine step into the plain-language sentence shown under the animation (FR4). */
export function narrate(step: Pick<Step, 'narration' | 'params'>): string {
  const template = templates[step.narration] ?? step.narration;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(step.params[key] ?? ''));
}
