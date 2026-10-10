import { describe, expect, it } from 'vitest';
import { cellText } from '@/utils/cellText';

describe('cellText', () => {
  it('shows nothing for null and undefined', () => {
    expect(cellText(null)).toBe('');
    expect(cellText(undefined)).toBe('');
  });

  it('returns strings as they are', () => {
    expect(cellText('Asha')).toBe('Asha');
    expect(cellText('')).toBe('');
  });

  it('stringifies numbers, booleans and bigints', () => {
    expect(cellText(42)).toBe('42');
    expect(cellText(false)).toBe('false');
    expect(cellText(10n)).toBe('10');
  });

  it('shows a date as its string form', () => {
    const date = new Date(Date.UTC(2026, 0, 2, 3, 4, 5));
    expect(cellText(date)).toBe(String(date));
  });

  it('joins array items with commas, nested arrays and empty cells included', () => {
    expect(cellText(['a', 1, null, ['b', 'c']])).toBe('a,1,,b,c');
    expect(cellText([])).toBe('');
  });

  it('writes any other object as JSON, never [object Object]', () => {
    expect(cellText({ city: 'Pune', zip: 411001 })).toBe('{"city":"Pune","zip":411001}');
  });

  it('shows nothing for values JSON cannot represent', () => {
    expect(cellText(() => 1)).toBe('');
    expect(cellText(Symbol('x'))).toBe('');
  });
});
