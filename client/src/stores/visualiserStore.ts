import {
  fromSpec,
  insert,
  randomTree,
  remove,
  search,
  type BTree,
  type Operation,
  type Trace,
} from '@btree/engine';
import { create } from 'zustand';
import { presets, type Preset } from '../lib/content';

interface VisualiserState {
  order: number;
  /** Tree the next operation runs on. */
  tree: BTree;
  trace: Trace | null;
  index: number;
  playing: boolean;
  /** Playback speed multiplier (0.5 to 2). */
  speed: number;
  language: 'plain' | 'java';
  showBst: boolean;
  presetId: string;
  /** Keys inserted so far, used to draw the BST comparison. */
  history: number[];

  loadPreset: (id: string) => void;
  setOrder: (order: number) => void;
  randomise: (seed?: number) => void;
  run: (op: Operation, key: number) => void;
  next: () => void;
  prev: () => void;
  restart: () => void;
  goTo: (i: number) => void;
  setPlaying: (p: boolean) => void;
  setSpeed: (s: number) => void;
  setLanguage: (l: 'plain' | 'java') => void;
  setShowBst: (b: boolean) => void;
}

const keysOf = (spec: Preset['tree']): number[] =>
  spec ? [...spec.keys, ...(spec.children ?? []).flatMap((c) => keysOf(c))] : [];

const initialPreset = presets[0]!;

/** State of the visualiser sandbox (FR2–FR5). The engine computes traces; this store replays them. */
export const useVisualiserStore = create<VisualiserState>()((set, get) => {
  /** Tree at the end of the current trace, or the base tree. */
  const current = () => get().trace?.result ?? get().tree;

  return {
    order: initialPreset.order,
    tree: fromSpec(initialPreset.order, initialPreset.tree),
    trace: null,
    index: 0,
    playing: false,
    speed: 1,
    language: 'plain',
    showBst: false,
    presetId: initialPreset.id,
    history: keysOf(initialPreset.tree),

    loadPreset: (id) => {
      const p = presets.find((x) => x.id === id);
      if (!p) return;
      set({
        presetId: id,
        order: p.order,
        tree: fromSpec(p.order, p.tree),
        trace: null,
        index: 0,
        playing: false,
        history: keysOf(p.tree),
      });
    },

    setOrder: (order) => {
      // Rebuild the same keys under the new order so students can compare shapes.
      const keys = get().history;
      const tree = keys.reduce((t, k) => insert(t, k).result, fromSpec(order, null));
      set({ order, tree, trace: null, index: 0, playing: false });
    },

    randomise: (seed = Date.now()) => {
      const tree = randomTree(get().order, 10, seed);
      const keys: number[] = [];
      const walk = (n: BTree['root']) => n && (keys.push(...n.keys), n.children.forEach(walk));
      walk(tree.root);
      set({ tree, trace: null, index: 0, playing: false, presetId: 'random', history: keys });
    },

    run: (op, key) => {
      const base = current();
      const fn = op === 'search' ? search : op === 'insert' ? insert : remove;
      const trace = fn(base, key);
      const history =
        op === 'insert' && !get().history.includes(key)
          ? [...get().history, key]
          : op === 'delete'
            ? get().history.filter((k) => k !== key)
            : get().history;
      set({ tree: base, trace, index: 0, playing: true, history });
    },

    next: () => {
      const { trace, index } = get();
      if (!trace) return;
      if (index >= trace.steps.length - 1) set({ playing: false });
      else set({ index: index + 1 });
    },
    prev: () => set((s) => ({ index: Math.max(0, s.index - 1), playing: false })),
    restart: () => set({ index: 0, playing: false }),
    goTo: (i) => set({ index: i, playing: false }),
    setPlaying: (playing) => set({ playing }),
    setSpeed: (speed) => set({ speed }),
    setLanguage: (language) => set({ language }),
    setShowBst: (showBst) => set({ showBst }),
  };
});
