import type { Cheer } from '@btree/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useCheers, useMe } from '../api/hooks';

interface CheersSeenState {
  seen: Record<string, string>;
  markSeen: (userId: string, at: string) => void;
}

export const useCheersSeenStore = create<CheersSeenState>()(
  persist(
    (set) => ({
      seen: {},
      markSeen: (userId, at) =>
        set((s) => ((s.seen[userId] ?? '') >= at ? s : { seen: { ...s.seen, [userId]: at } })),
    }),
    { name: 'btree-cheers-seen' },
  ),
);

export const cheersFor = (cheers: Cheer[], userId: string) =>
  cheers.filter((c) => c.toId === userId);

export const unseen = (cheers: Cheer[], userId: string, seenAt = '') =>
  cheersFor(cheers, userId).filter((c) => c.createdAt > seenAt);

export function useNewCheers() {
  const me = useMe();
  const cheers = useCheers(Boolean(me.data));
  const seenAt = useCheersSeenStore((s) => (me.data ? s.seen[me.data.id] : undefined));
  return me.data && cheers.data ? unseen(cheers.data, me.data.id, seenAt) : [];
}
