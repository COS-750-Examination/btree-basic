import { DAILY_NEXT, dailyMoves } from '@btree/engine';
import { describe, expect, it } from 'vitest';
import { dailyHint, dailyMistake } from './dailyHints';

const moves = dailyMoves([20, 8, 12, 28, 30, 5, 3]);
const place = (key: number) => moves.find((m) => m.kind === 'place' && m.key === key)!;
const checks = (key: number) => moves.filter((m) => m.kind === 'check' && m.key === key);

describe('dailyHint', () => {
  it('is short and only about the current step', () => {
    expect(dailyHint(place(20))).toBe('Drop 20 on the dashed spot.');
    expect(dailyHint(place(8))).toBe('There is only one node, so 8 goes there.');
    expect(dailyHint(place(28))).toBe('At the root, 28 > 12: go right. Keep going down to a leaf.');
    expect(dailyHint(place(5))).toBe('At the root, 5 < 12: go left. Keep going down to a leaf.');
  });

  it('says whether anything needs splitting', () => {
    const [split, next] = checks(30);
    expect(dailyHint(split!)).toBe('This node has too many keys. Drag its middle key up.');
    expect(dailyHint(next!)).toBe('No node is too full. Tap Next key.');
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
    const [split, next] = checks(30);
    expect(dailyMistake(next!, 12)).toBe('No node has too many keys.');
    expect(dailyMistake(split!, DAILY_NEXT)).toBe('A node has too many keys. Fix it first.');
    expect(dailyMistake(split!, 30)).toBe("That's not the middle key.");
    expect(dailyMistake(split!, 12)).toBe("That key's node isn't too full.");
    expect(dailyMistake(split!, '28@n1')).toBe(
      'Right key, but it moves into the node just above it.',
    );
  });
});
