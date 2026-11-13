import { describe, expect, it } from 'vitest';
import { addDays, dayKey } from '../src/lib/days';

describe('dayKey', () => {
  it("returns the South African date: 22:30 UTC on 12 November is '2026-11-13'", () => {
    expect(dayKey(new Date('2026-11-12T22:30:00Z'))).toBe('2026-11-13');
  });

  it('returns the same day for 00:00 and 23:59 South African time', () => {
    expect(dayKey(new Date('2026-11-12T22:00:00Z'))).toBe('2026-11-13');
    expect(dayKey(new Date('2026-11-13T21:59:00Z'))).toBe('2026-11-13');
  });
});

describe('addDays', () => {
  it("goes back across a month boundary: addDays('2026-11-01', -1) is '2026-10-31'", () => {
    expect(addDays('2026-11-01', -1)).toBe('2026-10-31');
  });

  it("goes forward across a year boundary: addDays('2026-12-31', 1) is '2027-01-01'", () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});
