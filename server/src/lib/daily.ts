import { createHmac } from 'node:crypto';
import { DAILY_KEY_COUNT, randomKeys } from '@btree/engine';
import { DAY_TIMEZONE } from '@btree/shared';
import { env } from '../env';
import { addDays } from './days';

export function dailyKeys(day: string): number[] {
  const seed = createHmac('sha256', env.JWT_SECRET).update(`daily:${day}`).digest().readUInt32BE(0);
  return randomKeys(DAILY_KEY_COUNT, seed, 99);
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
