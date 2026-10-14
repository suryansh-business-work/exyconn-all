import { describe, expect, it } from 'vitest';
import { formatDemoDuration } from '../../../../src/admin/shared/duration';

describe('formatDemoDuration', () => {
  it.each([
    [0, '0s'],
    [-2500, '0s'],
    [1400, '1s'],
    [45_000, '45s'],
    [59_499, '59s'],
  ])('writes %i ms under a minute as seconds (%s)', (ms, expected) => {
    expect(formatDemoDuration(ms)).toBe(expected);
  });

  it.each([
    [60_000, '1m'],
    [90 * 60_000, '1h 30m'],
    [2 * 3_600_000 + 5 * 60_000 + 59_000, '2h 5m'],
  ])('switches to the portal duration from a minute on (%i ms)', (ms, expected) => {
    expect(formatDemoDuration(ms)).toBe(expected);
  });
});
