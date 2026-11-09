/** A node of a B-tree. Leaves have an empty `children` array. */
export interface BTreeNode {
  /** Stable id so the UI can animate the same node across snapshots. */
  id: string;
  /** Keys in ascending order. */
  keys: number[];
  /** Either empty (leaf) or exactly `keys.length + 1` children. */
  children: BTreeNode[];
}

/**
 * A B-tree of order m: every node has at most m children and m - 1 keys,
 * every non-root node has at least ceil(m/2) - 1 keys, and all leaves are on the same level.
 */
export interface BTree {
  order: number;
  root: BTreeNode | null;
  /** Counter used to hand out node ids. */
  nextId: number;
}

export type Operation = 'search' | 'insert' | 'delete';

export type StepKind =
  // shared
  | 'start'
  | 'visit'
  | 'compare'
  | 'descend'
  | 'done'
  // search
  | 'found'
  | 'not-found'
  // insert
  | 'create-root'
  | 'duplicate'
  | 'insert-key'
  | 'overflow'
  | 'split'
  | 'promote'
  | 'new-root'
  // delete
  | 'replace-predecessor'
  | 'remove-key'
  | 'underflow'
  | 'borrow-left'
  | 'borrow-right'
  | 'merge'
  | 'shrink-root';

/**
 * Coarse phase used by the "Steps" panel in the visualiser
 * (e.g. "Find the leaf", "Add 25 in order", "Split", "Promote").
 */
export type StepPhase = 'find' | 'place' | 'split' | 'promote' | 'remove' | 'rebalance' | 'finish';

/** One event of an algorithm run. Replaying steps in order animates the operation. */
export interface Step {
  kind: StepKind;
  phase: StepPhase;
  /** Snapshot of the whole tree *after* this step. Immutable: step back = previous index. */
  tree: BTree;
  /** Ids of nodes the UI should highlight. */
  nodeIds: string[];
  /** Keys the UI should highlight (new key, median, separator, ...). */
  keys: number[];
  /** 1-based line in the operation's pseudocode (see `pseudocode.ts`). */
  line: number;
  /** Narration template key; the client maps it to text in `content/narration.json`. */
  narration: string;
  /** Values interpolated into the narration template. */
  params: Record<string, number | string>;
}

export interface Trace {
  operation: Operation;
  key: number;
  order: number;
  /** Tree before the operation ran. */
  initial: BTree;
  /** Tree after the operation ran. */
  result: BTree;
  steps: Step[];
}
