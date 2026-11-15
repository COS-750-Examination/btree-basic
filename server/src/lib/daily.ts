import { createHmac } from 'node:crypto';
import {
  DAILY_KEY_COUNT,
  DAILY_PATH_KEY_COUNT,
  DAILY_VALID_KEY_COUNT,
  DAILY_VALID_TREES,
  randomKeys,
} from '@btree/engine';
import { DAY_TIMEZONE } from '@btree/shared';
import { env } from '../env';
import { addDays } from './days';

export interface DailyContentKeys {
  keys: number[];
  pathKeys: number[];
  validKeys: number[];
  seed: number;
}

const hmacSeed = (label: string) =>
  createHmac('sha256', env.JWT_SECRET).update(label).digest().readUInt32BE(0);

export function dailyContent(day: string): DailyContentKeys {
  const validCount = DAILY_VALID_TREES * DAILY_VALID_KEY_COUNT;
  const pool = randomKeys(
    DAILY_KEY_COUNT + DAILY_PATH_KEY_COUNT + validCount,
    hmacSeed(`daily:${day}`),
    99,
  );
  return {
    keys: pool.slice(0, DAILY_KEY_COUNT),
    pathKeys: pool.slice(DAILY_KEY_COUNT, DAILY_KEY_COUNT + DAILY_PATH_KEY_COUNT),
    validKeys: pool.slice(DAILY_KEY_COUNT + DAILY_PATH_KEY_COUNT),
    seed: hmacSeed(`daily-picks:${day}`) >>> 1,
  };
}

export function validKeySets(validKeys: number[]): number[][] {
  return Array.from({ length: DAILY_VALID_TREES }, (_, i) =>
    validKeys.slice(i * DAILY_VALID_KEY_COUNT, (i + 1) * DAILY_VALID_KEY_COUNT),
  );
}

function offsetMs(at: Date, tz: string): number {
  const name =
    new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' })
      .formatToParts(at)
      .find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  const m = /GMT([+-])(\d{2}):(\d{2})/.exec(name);
  if (!m) return 0;
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) * 60_000;
}

export function nextDayStart(day: string, tz: string = DAY_TIMEZONE): Date {
  const base = Date.parse(`${addDays(day, 1)}T00:00:00Z`);
  return new Date(base - offsetMs(new Date(base), tz));
}
