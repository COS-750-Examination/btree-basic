import { DAY_TIMEZONE } from '@btree/shared';

export function practiceDay(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: DAY_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

const storageKey = (account: string, day: string) => `practice-done:${account}:${day}`;

export function loadDone(account: string, day: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(account, day));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function saveDone(account: string, day: string, done: string[]): void {
  try {
    localStorage.setItem(storageKey(account, day), JSON.stringify(done));
  } catch {
    return;
  }
}

export function nextUnfinished<T extends string>(
  order: readonly T[],
  done: readonly string[],
  current: T,
): T | null {
  const start = order.indexOf(current);
  for (let step = 1; step <= order.length; step += 1) {
    const candidate = order[(start + step) % order.length]!;
    if (!done.includes(candidate)) return candidate;
  }
  return null;
}
