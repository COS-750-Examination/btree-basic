import { describe, expect, it } from 'vitest';
import { inviteUrl, safeNext } from './invite';

describe('invite helpers', () => {
  it('builds the link from the site address', () => {
    expect(inviteUrl('K7Q2XMAB', 'https://btree.example')).toBe(
      'https://btree.example/add/K7Q2XMAB',
    );
  });

  it('only allows going back to a page on this site after signing in', () => {
    expect(safeNext('/add/K7Q2XMAB')).toBe('/add/K7Q2XMAB');
    expect(safeNext('//evil.example')).toBeNull();
    expect(safeNext('/\\evil.example')).toBeNull();
    expect(safeNext('https://evil.example')).toBeNull();
    expect(safeNext(null)).toBeNull();
  });
});
