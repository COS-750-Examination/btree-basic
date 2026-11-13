import { fromSpec, insert, remove, toSpec, validate, type NodeSpec } from '@btree/engine';
import {
  MODULES,
  OBJECTIVE_IDS,
  READY_CHECK_ITEM_IDS,
  type QuizItem,
  type TreeSpec,
} from '@btree/shared';
import { describe, expect, it } from 'vitest';
import { lessonMarkdown, lessons, presets, quizFor, quizzes } from '../lib/content';

const items = quizzes.flatMap((q) => q.items);

function searchPath(spec: TreeSpec, key: number): number[][] {
  const path: number[][] = [];
  let node: TreeSpec | undefined = spec;
  while (node) {
    path.push(node.keys);
    if (node.keys.includes(key) || !node.children?.length) break;
    const i: number = node.keys.filter((k) => k < key).length;
    node = node.children[i];
  }
  return path;
}

const ENGINE_ANSWERS: Record<string, { op: 'insert' | 'delete'; key: number; result: NodeSpec }> = {
  'm6-q1': {
    op: 'insert',
    key: 10,
    result: { keys: [20], children: [{ keys: [8, 10] }, { keys: [28, 30] }] },
  },
  'm7-q1': {
    op: 'delete',
    key: 30,
    result: { keys: [20], children: [{ keys: [8] }, { keys: [28] }] },
  },
  'm7-q2': {
    op: 'delete',
    key: 20,
    result: { keys: [12], children: [{ keys: [8] }, { keys: [28, 30] }] },
  },
  'm7-q3': {
    op: 'delete',
    key: 8,
    result: { keys: [28], children: [{ keys: [20] }, { keys: [30] }] },
  },
  'm7-q4': { op: 'delete', key: 8, result: { keys: [20, 30] } },
  'r-o4': {
    op: 'insert',
    key: 25,
    result: { keys: [30], children: [{ keys: [10, 20, 25] }, { keys: [40, 50, 60] }] },
  },
  'r-o6': {
    op: 'insert',
    key: 55,
    result: {
      keys: [40],
      children: [
        { keys: [20], children: [{ keys: [10] }, { keys: [30] }] },
        { keys: [55], children: [{ keys: [50] }, { keys: [60] }] },
      ],
    },
  },
  'r-o8': {
    op: 'delete',
    key: 30,
    result: { keys: [20, 50], children: [{ keys: [10] }, { keys: [40] }, { keys: [60] }] },
  },
};

describe('lesson content', () => {
  it('has a lesson and a quiz for every module', () => {
    for (const m of MODULES) {
      expect(
        lessons.find((l) => l.moduleId === m.id),
        `lesson ${m.id}`,
      ).toBeDefined();
      expect(quizFor(m.id), `quiz ${m.id}`).toBeDefined();
    }
  });

  it('points every lesson part at an existing Markdown file', () => {
    for (const part of lessons.flatMap((l) => l.parts)) {
      expect(lessonMarkdown(part.file)).not.toMatch(/^_Missing lesson file/);
    }
  });

  it('only uses valid B-trees in presets', () => {
    for (const p of presets.filter((x) => x.tree)) {
      expect(validate(fromSpec(p.order, p.tree)).violations, p.id).toEqual([]);
    }
  });
});

describe('quiz content', () => {
  it('uses unique item ids', () => {
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every multiple-choice item exactly one correct option', () => {
    for (const i of items) {
      if ('options' in i)
        expect(
          i.options.filter((o) => o.correct),
          i.id,
        ).toHaveLength(1);
    }
  });

  it('asks one ready-check question per objective', () => {
    const ready = quizFor(MODULES.at(-1)!.id)!;
    expect(ready.items.map((i) => i.objective).sort()).toEqual([...OBJECTIVE_IDS].sort());
  });

  it('uses the ready-check item ids the server expects (READY_CHECK_ITEM_IDS)', () => {
    const ready = quizFor(MODULES.at(-1)!.id)!;
    expect(ready.items.map((i) => i.id).sort()).toEqual([...READY_CHECK_ITEM_IDS].sort());
  });

  it('shows valid trees, except where validity is the question', () => {
    for (const i of items) {
      if (!i.tree || !i.order || i.type === 'valid-or-not') continue;
      expect(validate(fromSpec(i.order, i.tree)).violations, i.id).toEqual([]);
    }
  });

  it('breaks exactly the rule a valid-or-not item names', () => {
    for (const i of items.filter(
      (x): x is Extract<QuizItem, { type: 'valid-or-not' }> => x.type === 'valid-or-not',
    )) {
      const rules = new Set(validate(fromSpec(i.order!, i.tree!)).violations.map((v) => v.rule));
      expect([...rules], i.id).toEqual(i.valid ? [] : [i.brokenRule]);
    }
  });

  it('promotes the key a pick-median item expects', () => {
    for (const i of items.filter(
      (x): x is Extract<QuizItem, { type: 'pick-median' }> => x.type === 'pick-median',
    )) {
      const split = insert(fromSpec(i.order!, i.tree!), i.insertKey).steps.find(
        (s) => s.kind === 'split',
      );
      expect(split?.params.median, i.id).toBe(i.answer);
    }
  });

  it('matches the search path a trace-path item expects', () => {
    for (const i of items.filter(
      (x): x is Extract<QuizItem, { type: 'trace-path' }> => x.type === 'trace-path',
    )) {
      expect(searchPath(i.tree!, i.searchKey), i.id).toEqual(i.answerPath);
    }
  });

  it.each(Object.entries(ENGINE_ANSWERS))('agrees with the engine on %s', (id, expected) => {
    const item = items.find((i) => i.id === id)!;
    const tree = fromSpec(item.order!, item.tree!);
    const trace =
      expected.op === 'insert' ? insert(tree, expected.key) : remove(tree, expected.key);
    expect(toSpec(trace.result)).toEqual(expected.result);
  });
});
