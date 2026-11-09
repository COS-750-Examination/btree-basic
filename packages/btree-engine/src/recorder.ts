import { cloneTree } from './tree';
import type { BTree, Step } from './types';

type StepInput = Omit<Step, 'tree' | 'nodeIds' | 'keys' | 'params'> &
  Partial<Pick<Step, 'nodeIds' | 'keys' | 'params'>>;

/** Collects steps, snapshotting the working tree each time. */
export class Recorder {
  readonly steps: Step[] = [];

  constructor(private readonly tree: BTree) {}

  record(step: StepInput): void {
    this.steps.push({
      nodeIds: [],
      keys: [],
      params: {},
      ...step,
      tree: cloneTree(this.tree),
    });
  }
}
