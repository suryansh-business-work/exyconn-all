import { describe, it, expect } from 'vitest';
import { formatWith, toDate } from '../../src/utils/date';
import { enumOptions } from '../../src/utils/enumOptions';
import { formatBytes } from '../../src/utils/file';

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

describe('formatBytes', () => {
  it('scales to the largest unit that fits', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(88 * 1024 * 1024)).toBe('88.0 MB');
    expect(formatBytes(3 * 1024 ** 3)).toBe('3.0 GB');
  });

  it('shows whole bytes without decimals', () => {
    expect(formatBytes(0)).toBe('0 B');
  });
});
