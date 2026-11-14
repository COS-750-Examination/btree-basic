import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from '../api/client';
import { useSyncStore } from './syncStore';

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  useSyncStore.getState().clear();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('sync store', () => {
  it('queues a save that fails because the network is down', async () => {
    useSyncStore.getState().save(() => Promise.reject(new TypeError('Failed to fetch')));
    await flush();
    expect(useSyncStore.getState().queue).toHaveLength(1);
    expect(useSyncStore.getState().rejected).toBeNull();
  });

  it('does not queue a save the server refused, but flags it', async () => {
    useSyncStore.getState().save(() => Promise.reject(new ApiRequestError(400, 'Bad request')));
    await flush();
    expect(useSyncStore.getState().queue).toHaveLength(0);
    expect(useSyncStore.getState().rejected).toBe('refused');
  });

  it('flags a save refused because the session expired', async () => {
    useSyncStore.getState().save(() => Promise.reject(new ApiRequestError(401, 'Sign in')));
    await flush();
    expect(useSyncStore.getState().queue).toHaveLength(0);
    expect(useSyncStore.getState().rejected).toBe('expired');
  });

  it('queues new saves behind waiting ones and sends them in order on retry', async () => {
    const sent: string[] = [];
    let online = false;
    const call = (name: string) => () =>
      online ? Promise.resolve(sent.push(name)) : Promise.reject(new TypeError('offline'));

    useSyncStore.getState().save(call('first'));
    await flush();
    useSyncStore.getState().save(call('second'));
    expect(useSyncStore.getState().queue).toHaveLength(2);

    online = true;
    await useSyncStore.getState().retry();
    expect(sent).toEqual(['first', 'second']);
    expect(useSyncStore.getState().queue).toHaveLength(0);
  });

  it('keeps the queue when a retry still fails', async () => {
    useSyncStore.getState().save(() => Promise.reject(new TypeError('offline')));
    await flush();
    await useSyncStore.getState().retry();
    expect(useSyncStore.getState().queue).toHaveLength(1);
    expect(useSyncStore.getState().retrying).toBe(false);
  });
});
