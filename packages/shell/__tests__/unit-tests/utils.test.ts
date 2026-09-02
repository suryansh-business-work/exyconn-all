import { describe, it, expect } from 'vitest';
import { formatWith, toDate } from '../../src/utils/date';
import { enumOptions } from '../../src/utils/enumOptions';

describe('date utils', () => {
  it('parses ISO strings and formats with a pattern', () => {
    expect(formatWith('2026-01-15T00:00:00.000Z', 'yyyy-MM-dd')).toBe('2026-01-15');
  });

  it('returns empty string for invalid input', () => {
    expect(formatWith('not-a-date', 'yyyy')).toBe('');
    expect(toDate(null)).toBeNull();
  });
});

describe('enumOptions', () => {
  it('title-cases underscore-separated enum values', () => {
    expect(enumOptions(['IN_PROGRESS', 'OPEN'])).toEqual([
      { value: 'IN_PROGRESS', label: 'In Progress' },
      { value: 'OPEN', label: 'Open' },
    ]);
  });
});
