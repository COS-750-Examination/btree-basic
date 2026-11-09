import { buildTree } from './insert';
import { createTree } from './tree';
import type { BTree } from './types';

/** Small deterministic PRNG (mulberry32) so generated practice items are reproducible. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `count` distinct integers in [1, max], in random order. */
export function randomKeys(count: number, seed: number, max = 99): number[] {
  if (count > max) throw new RangeError('count must not exceed max');
  const rand = seededRandom(seed);
  const pool = Array.from({ length: max }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, count);
}

/** A valid B-tree built by inserting `count` random keys (FR5 sandbox, FR9 practice). */
export function randomTree(order: number, count: number, seed: number, max = 99): BTree {
  return buildTree(createTree(order), randomKeys(count, seed, max));
}
