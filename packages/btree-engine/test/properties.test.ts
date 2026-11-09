import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createTree, inOrderKeys, insert, remove, search, validate } from '../src';
import type { BTree } from '../src';

const order = fc.integer({ min: 3, max: 7 });
const keys = fc.uniqueArray(fc.integer({ min: 1, max: 200 }), { minLength: 1, maxLength: 40 });

/** NFR1: every snapshot of every operation is a valid B-tree. */
const allSnapshotsValid = (steps: { tree: BTree; kind: string }[]): boolean =>
  steps
    // Mid-operation states (overflowing before the split, underflowing before the fix) are
    // deliberately shown to students, so only check the snapshots between operations.
    .filter((s) => s.kind === 'done' || s.kind === 'duplicate' || s.kind === 'not-found')
    .every((s) => validate(s.tree).valid);

describe('B-tree properties', () => {
  it('stays valid and sorted after any insert sequence', () => {
    fc.assert(
      fc.property(order, keys, (m, ks) => {
        let tree = createTree(m);
        for (const k of ks) {
          const trace = insert(tree, k);
          expect(allSnapshotsValid(trace.steps)).toBe(true);
          tree = trace.result;
          expect(validate(tree).valid).toBe(true);
        }
        expect(inOrderKeys(tree)).toEqual([...ks].sort((a, b) => a - b));
      }),
    );
  });

  it('stays valid after inserting then deleting in random order', () => {
    fc.assert(
      fc.property(
        order,
        keys.chain((ks) => fc.tuple(fc.constant(ks), fc.shuffledSubarray(ks))),
        (m, [ks, toDelete]) => {
          let tree = ks.reduce((t, k) => insert(t, k).result, createTree(m));
          for (const k of toDelete) {
            const trace = remove(tree, k);
            tree = trace.result;
            const v = validate(tree);
            expect(v.violations).toEqual([]);
          }
          const remaining = ks.filter((k) => !toDelete.includes(k)).sort((a, b) => a - b);
          expect(inOrderKeys(tree)).toEqual(remaining);
        },
      ),
    );
  });

  it('search finds exactly the inserted keys', () => {
    fc.assert(
      fc.property(order, keys, fc.integer({ min: 1, max: 200 }), (m, ks, probe) => {
        const tree = ks.reduce((t, k) => insert(t, k).result, createTree(m));
        const found = search(tree, probe).steps.at(-1)?.kind === 'found';
        expect(found).toBe(ks.includes(probe));
      }),
    );
  });
});
