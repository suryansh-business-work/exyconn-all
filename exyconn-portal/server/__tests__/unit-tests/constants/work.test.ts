import {
  DEFAULT_WORK_HOURS_PER_DAY,
  WORK_HOURS_MAX,
  WORK_HOURS_MIN,
  WORK_LOCATIONS,
  WORKING_TIMES,
  workTargetMs,
} from '../../../src/constants/work';

const HOUR_MS = 3_600_000;

describe('workTargetMs', () => {
  it('converts the contracted hours to milliseconds', () => {
    expect(workTargetMs(6)).toBe(6 * HOUR_MS);
    expect(workTargetMs(WORK_HOURS_MIN)).toBe(HOUR_MS);
    expect(workTargetMs(WORK_HOURS_MAX)).toBe(24 * HOUR_MS);
  });

  it('falls back to the default day when HR has not set one', () => {
    expect(workTargetMs(null)).toBe(DEFAULT_WORK_HOURS_PER_DAY * HOUR_MS);
    expect(workTargetMs(undefined)).toBe(8 * HOUR_MS);
  });

  it('keeps a zero-hour day as zero rather than the default', () => {
    expect(workTargetMs(0)).toBe(0);
  });

  it('offers OTHER as a free-text choice for both time and place', () => {
    expect(WORKING_TIMES).toContain('OTHER');
    expect(WORK_LOCATIONS).toEqual(['OFFICE', 'HOME', 'HYBRID', 'OTHER']);
  });
});
