import { maxKeys, type Trace } from '@btree/engine';
import type { BTreeViewProps, Callout } from '../components/tree/BTreeView';

/** Maps the current step of a trace to the visual cues BTreeView understands. */
export function stepView(trace: Trace, index: number): Omit<BTreeViewProps, 'label'> {
  const step = trace.steps[index]!;
  const yarnEdges = trace.steps
    .slice(0, index + 1)
    .filter((s) => s.kind === 'descend')
    .map((s) => `${s.nodeIds[0]}>${s.nodeIds[1]}`);

  const median = ['overflow', 'split', 'promote', 'new-root'].includes(step.kind)
    ? step.keys[0]
    : undefined;
  const overflowNodeId =
    step.kind === 'overflow' ||
    step.narration === 'insert-key-full' ||
    step.narration === 'promote-overflow'
      ? step.nodeIds[0]
      : undefined;

  const callouts: Callout[] = [];
  const at = step.nodeIds[0];
  if (at) {
    if (step.kind === 'compare' && step.narration === 'compare-leaf') {
      callouts.push({ nodeId: at, text: `${step.params.key} belongs here` });
    } else if (step.kind === 'compare' && step.narration !== 'compare-equal') {
      const { key, lower, upper } = step.params;
      const text =
        step.narration === 'compare-less'
          ? `${key} < ${upper} · follow the yarn left`
          : step.narration === 'compare-greater'
            ? `${key} > ${lower} · follow the yarn right`
            : `${lower} < ${key} < ${upper}`;
      callouts.push({ nodeId: at, text });
    }
    if (step.kind === 'overflow') {
      const n = trace.order;
      callouts.push({
        nodeId: at,
        text: `Snap! ${n} keys on a branch built for ${maxKeys(n)}`,
        tone: 'danger',
      });
    }
    if (step.kind === 'promote' || step.kind === 'new-root')
      callouts.push({ nodeId: at, text: `${median} hops up` });
    if (step.kind === 'merge')
      callouts.push({ nodeId: at, text: `${step.params.separator} comes down` });
  }

  return {
    tree: step.tree,
    newKey: trace.operation === 'insert' ? trace.key : undefined,
    foundKey: step.kind === 'found' ? trace.key : undefined,
    medianKey: median,
    overflowNodeId,
    highlightNodeIds: overflowNodeId ? [] : step.nodeIds.slice(-1),
    yarnEdges,
    callouts,
  };
}
