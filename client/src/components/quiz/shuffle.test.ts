import { describe, expect, it } from 'vitest';
import { shuffle, shuffledOptions } from './shuffle';

const options = ['a', 'b', 'c', 'd'].map((id) => ({ id, text: id.toUpperCase() }));

describe('shuffle', () => {
  it('keeps every item exactly once', () => {
    expect(
      shuffle([1, 2, 3, 4, 5])
        .slice()
        .sort((x, y) => x - y),
    ).toEqual([1, 2, 3, 4, 5]);
  });

  it('uses the random source it is given', () => {
    expect(shuffle(['a', 'b', 'c', 'd'], () => 0)).toEqual(['b', 'c', 'd', 'a']);
  });

  it('does not change the original array', () => {
    const input = ['a', 'b', 'c'];
    shuffle(input, () => 0);
    expect(input).toEqual(['a', 'b', 'c']);
  });
});

describe('shuffledOptions', () => {
  it('keeps the same order for a question for the rest of the page load', () => {
    const first = shuffledOptions('same-question', options).map((o) => o.id);
    for (let i = 0; i < 10; i += 1) {
      expect(shuffledOptions('same-question', options).map((o) => o.id)).toEqual(first);
    }
  });

  it('moves the first option somewhere else for some questions', () => {
    const firstIds = Array.from(
      { length: 40 },
      (_, i) => shuffledOptions(`q-${i}`, options)[0]!.id,
    );
    expect(new Set(firstIds).size).toBeGreaterThan(1);
  });
});
