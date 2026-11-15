import { DAILY_NEXT, dailyMoves } from '@btree/engine';
import { describe, expect, it } from 'vitest';
import { branchReason, dailyHint, dailyMistake, nodeLabel } from './dailyHints';

const moves = dailyMoves([20, 8, 12, 28, 30, 5, 3]);
const place = (key: number) => moves.find((m) => m.kind === 'place' && m.key === key)!;
const checks = (key: number) => moves.filter((m) => m.kind === 'check' && m.key === key);

describe('dailyHint', () => {
  it('is short and only about the current step', () => {
    expect(dailyHint(place(8))).toBe('There is only one node, so 8 goes there.');
    expect(dailyHint(place(28))).toBe('At the root, 28 > 12: go right. Keep going down to a leaf.');
    expect(dailyHint(place(5))).toBe('At the root, 5 < 12: go left. Keep going down to a leaf.');
  });

  it('points at the full node on a split step', () => {
    const [split] = checks(30);
    expect(dailyHint(split!)).toBe('This node has too many keys. Drag its middle key up.');
  });
});

describe('dailyMistake', () => {
  it('explains a wrong leaf without naming the right one', () => {
    const move = place(5);
    expect(dailyMistake(move, move.tree.root!.id)).toBe('New keys only go into a leaf.');
    expect(dailyMistake(place(28), 'n1')).toBe(
      'Not this leaf. Compare 28 with the keys from the root down.',
    );
  });

  it('explains wrong split choices', () => {
    const [split] = checks(30);
    expect(dailyMistake(place(28), 12)).toBe('No node has too many keys.');
    expect(dailyMistake(place(28), '12@n1')).toBe('No node has too many keys.');
    expect(dailyMistake(split!, DAILY_NEXT)).toBe(
      'A node has too many keys. Fix it before adding the next number.',
    );
    expect(dailyMistake(split!, 30)).toBe("That's not the middle key.");
    expect(dailyMistake(split!, 12)).toBe("That key's node isn't too full.");
    expect(dailyMistake(split!, '28@n1')).toBe(
      'Right key, but it moves into the node just above it.',
    );
  });
});

describe('branchReason', () => {
  const node = { id: 'n1', keys: [30, 60], children: [] };

  it('explains the left, middle and right branches', () => {
    expect(branchReason(node, 10)).toBe('10 is smaller than 30, so it goes down the left branch');
    expect(branchReason(node, 57)).toBe('57 is between 30 and 60, so it takes the middle branch');
    expect(branchReason(node, 70)).toBe('70 is bigger than 60, so it goes down the right branch');
  });

  it('names nodes for screen readers', () => {
    expect(nodeLabel([30, 60])).toBe('Node holding 30 and 60');
    expect(nodeLabel([5])).toBe('Node holding 5');
  });
});
