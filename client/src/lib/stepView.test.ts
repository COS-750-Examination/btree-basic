import { fromSpec, insert } from '@btree/engine';
import { describe, expect, it } from 'vitest';
import { narrate } from './narration';
import { stepView } from './stepView';

describe('stepView', () => {
  const trace = insert(
    fromSpec(3, { keys: [20], children: [{ keys: [8, 12] }, { keys: [28, 30] }] }),
    25,
  );

  it('marks the overflowing node and median on the overflow step', () => {
    const i = trace.steps.findIndex((s) => s.kind === 'overflow');
    const view = stepView(trace, i);
    expect(view.medianKey).toBe(28);
    expect(view.overflowNodeId).toBeDefined();
    expect(view.callouts?.[0]?.text).toMatch(/Snap!/);
  });

  it('accumulates the golden yarn path', () => {
    expect(stepView(trace, trace.steps.length - 1).yarnEdges).toHaveLength(1);
  });

  it('has narration text for every step', () => {
    for (const s of trace.steps) expect(narrate(s)).not.toBe(s.narration);
  });
});
