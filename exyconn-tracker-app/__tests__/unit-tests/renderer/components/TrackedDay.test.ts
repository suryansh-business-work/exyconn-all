// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { dateKey } from '../../../../src/renderer/components/TrackedDay';

describe('dateKey', () => {
  it('keys a date by its local calendar day, zero-padded like the portal’s', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(dateKey(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
  });
});
