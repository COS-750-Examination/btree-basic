import { DAILY_ROUNDS, type DailyEntry, type DailyState } from '@btree/shared';
import { useEffect, useState } from 'react';

export function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export const formatScore = (score: number) => score.toFixed(2);

export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function dayTotalSoFar(state: DailyState): number {
  const sum = state.rounds.reduce((t, r) => t + (r.result?.score ?? 0), 0);
  return Math.round((sum / DAILY_ROUNDS.length) * 100) / 100;
}

export type LeaderboardTab = 'total' | 'path' | 'valid' | 'build';

export function rankBy(entries: DailyEntry[], tab: LeaderboardTab): DailyEntry[] {
  return [...entries].sort((a, b) => b[tab] - a[tab] || b.total - a.total);
}
