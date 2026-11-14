import type { Cheer } from '@btree/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { cheersFor, unseen, useCheersSeenStore } from './cheersStore';

const cheer = (id: string, toId: string, createdAt: string): Cheer => ({
  id,
  fromId: toId === 'me' ? 'sam' : 'me',
  toId,
  fromName: toId === 'me' ? 'Sam' : 'Me',
  toName: toId === 'me' ? 'Me' : 'Sam',
  message: null,
  moduleId: null,
  createdAt,
});

const list = [
  cheer('c3', 'me', '2026-11-15T10:00:00.000Z'),
  cheer('c2', 'sam', '2026-11-15T09:00:00.000Z'),
  cheer('c1', 'me', '2026-11-14T08:00:00.000Z'),
];

beforeEach(() => useCheersSeenStore.setState({ seen: {} }));

describe('cheers seen', () => {
  it('only counts cheers sent to you', () => {
    expect(cheersFor(list, 'me').map((c) => c.id)).toEqual(['c3', 'c1']);
  });

  it('counts every received cheer as new until the grove is opened', () => {
    expect(unseen(list, 'me').map((c) => c.id)).toEqual(['c3', 'c1']);
    expect(unseen(list, 'me', '2026-11-14T08:00:00.000Z').map((c) => c.id)).toEqual(['c3']);
    expect(unseen(list, 'me', '2026-11-15T10:00:00.000Z')).toEqual([]);
  });

  it('remembers the latest seen time per student and never goes backwards', () => {
    const { markSeen } = useCheersSeenStore.getState();
    markSeen('me', '2026-11-15T10:00:00.000Z');
    markSeen('me', '2026-11-14T08:00:00.000Z');
    markSeen('other', '2026-11-01T00:00:00.000Z');
    expect(useCheersSeenStore.getState().seen).toEqual({
      me: '2026-11-15T10:00:00.000Z',
      other: '2026-11-01T00:00:00.000Z',
    });
  });
});
