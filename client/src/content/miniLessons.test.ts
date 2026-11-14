import { fromSpec, insert, remove, toSpec, validate, type NodeSpec } from '@btree/engine';
import { OBJECTIVE_IDS } from '@btree/shared';
import { describe, expect, it } from 'vitest';
import { miniLesson } from '../lib/content';

const leaf = (...keys: number[]): NodeSpec => ({ keys });
const node = (keys: number[], ...children: NodeSpec[]): NodeSpec => ({ keys, children });
const tree = (spec: NodeSpec) => fromSpec(3, spec);
const after = (spec: NodeSpec, op: 'insert' | 'delete', key: number) =>
  toSpec((op === 'insert' ? insert : remove)(tree(spec), key).result);

const rootTwoKeys = node([20, 40], leaf(5, 12), leaf(25, 30), leaf(50, 60));

describe('mini-lessons', () => {
  it('has a lesson with an example, a check and an answer for every objective', () => {
    for (const id of OBJECTIVE_IDS) {
      const md = miniLesson(id);
      expect(md, id).toBeDefined();
      for (const heading of [
        '## The key idea',
        '## Worked example',
        '## Check yourself',
        '## Answer',
      ])
        expect(md, `${id} ${heading}`).toContain(heading);
    }
  });
});

describe('mini-lesson worked examples match the engine', () => {
  it('O2: the example tree is invalid and the check tree overflows', () => {
    expect(validate(tree(node([20, 40], leaf(10), leaf(30), leaf(35, 50)))).valid).toBe(false);
    expect(validate(tree(node([15], leaf(5, 10, 12), leaf(20)))).valid).toBe(false);
  });

  it('O4: inserting into a leaf with room', () => {
    expect(after(node([20, 40], leaf(5, 12), leaf(25), leaf(50, 60)), 'insert', 27)).toEqual(
      node([20, 40], leaf(5, 12), leaf(25, 27), leaf(50, 60)),
    );
    expect(after(node([20, 40], leaf(5, 12), leaf(25, 30), leaf(50)), 'insert', 45)).toEqual(
      node([20, 40], leaf(5, 12), leaf(25, 30), leaf(45, 50)),
    );
  });

  it('O5: splitting a leaf', () => {
    const start = node([20], leaf(5, 12), leaf(25, 30));
    expect(after(start, 'insert', 8)).toEqual(node([8, 20], leaf(5), leaf(12), leaf(25, 30)));
    expect(after(start, 'insert', 35)).toEqual(node([20, 30], leaf(5, 12), leaf(25), leaf(35)));
    expect(toSpec(insert(fromSpec(4, leaf(10, 30, 40)), 20).result)).toEqual(
      node([20], leaf(10), leaf(30, 40)),
    );
  });

  it('O6: a split that reaches the root', () => {
    expect(after(rootTwoKeys, 'insert', 55)).toEqual(
      node([40], node([20], leaf(5, 12), leaf(25, 30)), node([55], leaf(50), leaf(60))),
    );
    expect(after(rootTwoKeys, 'insert', 8)).toEqual(
      node([20], node([8], leaf(5), leaf(12)), node([40], leaf(25, 30), leaf(50, 60))),
    );
  });

  it('O8: borrowing and merging', () => {
    expect(after(node([20], leaf(8), leaf(28, 30)), 'delete', 8)).toEqual(
      node([28], leaf(20), leaf(30)),
    );
    expect(after(node([20], leaf(8), leaf(30)), 'delete', 8)).toEqual(leaf(20, 30));
    expect(after(node([20, 40], leaf(5), leaf(25), leaf(50, 60)), 'delete', 25)).toEqual(
      node([20, 50], leaf(5), leaf(40), leaf(60)),
    );
  });
});
