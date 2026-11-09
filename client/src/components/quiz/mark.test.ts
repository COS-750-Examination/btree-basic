import { describe, expect, it } from 'vitest';
import { quizFor } from '../../lib/content';
import { mark } from './mark';

const quiz = quizFor(6)!;
const byId = (id: string) => quiz.items.find((i) => i.id === id)!;

describe('mark', () => {
  it('flags promoting the new key as a misconception', () => {
    const r = mark(byId('m6-q2'), '25');
    expect(r.correct).toBe(false);
    expect(r.misconception).toBe('promote-new-key');
  });

  it('accepts the median', () => {
    expect(mark(byId('m6-q2'), '28').correct).toBe(true);
  });

  it('marks multiple choice with option feedback', () => {
    const r = mark(byId('m6-q3'), 'c');
    expect(r.correct).toBe(false);
    expect(r.feedback).toMatch(/middle key moves up/);
  });

  it('requires the right broken rule for invalid trees', () => {
    const item = byId('m6-q5');
    expect(mark(item, 'invalid:max-keys').correct).toBe(false);
    expect(mark(item, 'invalid:leaf-depth').correct).toBe(true);
  });
});
