import { afterEach, describe, expect, it, vi } from 'vitest';
import { hourIn } from '../../src/schedule';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('hourIn', () => {
  it('reads the hour on a clock in the given zone', () => {
    const at = new Date('2026-02-03T18:45:00.000Z');
    expect(hourIn('UTC', at)).toBe(18);
    expect(hourIn('Asia/Kolkata', at)).toBe(0);
  });

  it('reads midnight when the runtime returns no hour part', () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, 'formatToParts').mockReturnValue([]);

    expect(hourIn('UTC', new Date('2026-02-03T18:45:00.000Z'))).toBe(0);
  });
});
