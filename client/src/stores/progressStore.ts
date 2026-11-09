import {
  LEAF_REWARDS,
  MODULES,
  readiness,
  type AttemptLike,
  type Confidence,
  type LeafReason,
} from '@btree/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { api } from '../api/client';

export interface LocalAttempt extends AttemptLike {
  itemId: string;
  confidence?: Confidence;
  misconception?: string;
  at: number;
}

interface ModuleState {
  part: number;
  completed: boolean;
}

interface ProgressState {
  /** True once the user has a session; actions then also save to the API (FR11). */
  signedIn: boolean;
  modules: Record<number, ModuleState>;
  attempts: LocalAttempt[];
  leaves: number;
  ledger: { amount: number; reason: LeafReason; at: number }[];
  /** null until the warm-up is done; true adds module 2 (search trees recap) to the path. */
  needsRecap: boolean | null;
  lectureQuestions: { id: string; text: string }[];
  ownedDecorations: string[];

  setSignedIn: (v: boolean) => void;
  hydrateFromServer: () => Promise<void>;
  setPart: (moduleId: number, part: number) => void;
  completeModule: (moduleId: number) => void;
  recordAttempt: (a: Omit<LocalAttempt, 'at'>) => void;
  readHint: () => void;
  finishWarmup: (
    correct: number,
    total: number,
    answers: { itemId: string; correct: boolean; skipped: boolean }[],
  ) => void;
  addLectureQuestion: (text: string) => void;
  removeLectureQuestion: (id: string) => void;
  buyDecoration: (id: string, cost: number) => boolean;
  reset: () => void;
}

const initial = {
  modules: {},
  attempts: [],
  leaves: 0,
  ledger: [],
  needsRecap: null,
  lectureQuestions: [],
  ownedDecorations: [],
};

/** Fire-and-forget save; the app keeps working if the API is down (NFR7). */
const save = (fn: () => Promise<unknown>) => {
  fn().catch((e: unknown) => console.warn('Could not save progress:', e));
};

/**
 * Learner progress. Guests keep it in sessionStorage only (FR12); signed-in students also
 * save every change to the API and reload it on sign-in.
 */
export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => {
      const earn = (reason: Exclude<LeafReason, 'purchase'>) =>
        set((s) => ({
          leaves: s.leaves + LEAF_REWARDS[reason],
          ledger: [{ amount: LEAF_REWARDS[reason], reason, at: Date.now() }, ...s.ledger],
        }));

      return {
        ...initial,
        signedIn: false,

        setSignedIn: (signedIn) => set({ signedIn }),

        hydrateFromServer: async () => {
          const [progress, leaves, questions, decorations] = await Promise.all([
            api.get<{ modules: { moduleId: number; part: number; completed: boolean }[] }>(
              '/progress',
            ),
            api.get<{ balance: number }>('/leaves'),
            api.get<{ id: string; text: string }[]>('/lecture-questions'),
            api.get<{ id: string; owned: boolean }[]>('/decorations'),
          ]);
          set({
            modules: Object.fromEntries(
              progress.modules.map((m) => [m.moduleId, { part: m.part, completed: m.completed }]),
            ),
            leaves: leaves.balance,
            lectureQuestions: questions,
            ownedDecorations: decorations.filter((d) => d.owned).map((d) => d.id),
          });
        },

        setPart: (moduleId, part) => {
          const current = get().modules[moduleId];
          set((s) => ({
            modules: { ...s.modules, [moduleId]: { completed: current?.completed ?? false, part } },
          }));
          if (get().signedIn) {
            save(() =>
              api.put('/progress', {
                modules: [{ moduleId, part, completed: current?.completed ?? false }],
              }),
            );
          }
        },

        completeModule: (moduleId) => {
          const current = get().modules[moduleId];
          if (current?.completed) return;
          set((s) => ({
            modules: { ...s.modules, [moduleId]: { part: current?.part ?? 1, completed: true } },
          }));
          earn('lesson');
          if (get().signedIn) {
            save(() =>
              api.put('/progress', {
                modules: [{ moduleId, part: current?.part ?? 1, completed: true }],
              }),
            );
          }
        },

        recordAttempt: (a) => {
          set((s) => ({ attempts: [...s.attempts, { ...a, at: Date.now() }] }));
          if (a.correct) earn(a.firstAttempt && a.hintsUsed === 0 ? 'firstTry' : 'withHint');
          if (get().signedIn) {
            const {
              itemId,
              objective,
              correct,
              firstAttempt,
              hintsUsed,
              confidence,
              misconception,
            } = a;
            save(() =>
              api.post('/attempts', {
                itemId,
                objective,
                correct,
                firstAttempt,
                hintsUsed,
                confidence,
                misconception,
              }),
            );
          }
        },

        readHint: () => {
          earn('hintRead');
          if (get().signedIn) save(() => api.post('/hints'));
        },

        finishWarmup: (correct, total, answers) => {
          set({ needsRecap: correct < Math.ceil(total * 0.6) });
          if (get().signedIn) save(() => api.post('/warmup', { answers }));
        },

        addLectureQuestion: (text) => {
          const id = crypto.randomUUID();
          set((s) => ({ lectureQuestions: [...s.lectureQuestions, { id, text }] }));
          if (get().signedIn) save(() => api.post('/lecture-questions', { text }));
        },

        removeLectureQuestion: (id) => {
          set((s) => ({ lectureQuestions: s.lectureQuestions.filter((q) => q.id !== id) }));
          if (get().signedIn) save(() => api.delete(`/lecture-questions/${id}`));
        },

        buyDecoration: (id, cost) => {
          const s = get();
          if (s.leaves < cost || s.ownedDecorations.includes(id)) return false;
          set({
            leaves: s.leaves - cost,
            ledger: [{ amount: -cost, reason: 'purchase', at: Date.now() }, ...s.ledger],
            ownedDecorations: [...s.ownedDecorations, id],
          });
          if (s.signedIn) save(() => api.post(`/decorations/${id}/purchase`));
          return true;
        },

        reset: () => set({ ...initial }),
      };
    },
    {
      name: 'btree-progress',
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ signedIn: _signedIn, ...rest }) => rest,
    },
  ),
);

/* ---------- Derived values ---------- */

export const modulesDone = (s: Pick<ProgressState, 'modules'>) =>
  Object.values(s.modules).filter((m) => m.completed).length;

/** Module 2 (recap) is only required when the warm-up showed it is needed. */
export const isRequired = (moduleId: number, needsRecap: boolean | null) =>
  moduleId !== 2 || needsRecap === true;

export function moduleStatus(
  moduleId: number,
  s: Pick<ProgressState, 'modules' | 'needsRecap'>,
): 'done' | 'current' | 'available' | 'locked' {
  if (s.modules[moduleId]?.completed) return 'done';
  const earlier = MODULES.filter((m) => m.id < moduleId && isRequired(m.id, s.needsRecap));
  if (earlier.some((m) => !s.modules[m.id]?.completed)) return 'locked';
  const next = MODULES.find((m) => isRequired(m.id, s.needsRecap) && !s.modules[m.id]?.completed);
  return next?.id === moduleId ? 'current' : 'available';
}

export function useLocalReadiness() {
  const s = useProgressStore();
  return readiness(s.attempts, modulesDone(s), s.leaves);
}
