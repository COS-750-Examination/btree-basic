import { create } from 'zustand';
import { ApiRequestError } from '../api/client';

type SaveCall = () => Promise<unknown>;

interface SyncState {
  /** Saves that failed for a reason worth retrying (offline, server error), oldest first. */
  queue: SaveCall[];
  /**
   * The server refused a save, so retrying would not help: `expired` for 401 (the session
   * ended, so the student must sign in again), `refused` for any other 4xx.
   */
  rejected: 'expired' | 'refused' | null;
  retrying: boolean;
  /** Runs a save and keeps it for a retry if it fails. Never throws. */
  save: (call: SaveCall) => void;
  /** Re-sends the queued saves in order, stopping at the first one that still fails. */
  retry: () => Promise<void>;
  dismissRejected: () => void;
  /** Drops everything, e.g. on sign-out, so one student's saves never go to another account. */
  clear: () => void;
}

/** Offline, timeouts and server errors may pass; a 4xx means the request itself is wrong. */
const isRetryable = (e: unknown) =>
  !(e instanceof ApiRequestError) || e.status >= 500 || e.status === 408 || e.status === 429;

const rejection = (e: unknown): SyncState['rejected'] =>
  e instanceof ApiRequestError && e.status === 401 ? 'expired' : 'refused';

/**
 * Tracks progress saves that did not reach the API, so the student is told instead of the
 * save failing silently, and so the saves can be sent again once the connection is back.
 * Kept in memory only: a reload loses the queue, which is why the banner says so.
 */
export const useSyncStore = create<SyncState>()((set, get) => {
  const fail = (call: SaveCall, e: unknown) => {
    console.warn('Could not save progress:', e);
    if (isRetryable(e)) set((s) => ({ queue: [...s.queue, call] }));
    else set({ rejected: rejection(e) });
  };

  return {
    queue: [],
    rejected: null,
    retrying: false,

    save: (call) => {
      // While older saves are waiting, queue behind them so the server sees changes in order.
      if (get().queue.length > 0) {
        set((s) => ({ queue: [...s.queue, call] }));
        return;
      }
      call().catch((e: unknown) => fail(call, e));
    },

    retry: async () => {
      if (get().retrying) return;
      set({ retrying: true });
      try {
        while (get().queue.length > 0) {
          const [next] = get().queue;
          try {
            await next!();
          } catch (e) {
            if (isRetryable(e)) return; // still offline: keep this one and the rest
            set({ rejected: rejection(e) });
          }
          set((s) => ({ queue: s.queue.slice(1) }));
        }
      } finally {
        set({ retrying: false });
      }
    },

    dismissRejected: () => set({ rejected: null }),
    clear: () => set({ queue: [], rejected: null }),
  };
});
