import { describe, expect, it } from 'vitest';
import { DEFAULT_WORK_HOURS, describeArrangement, humanize, workHours } from '@/components/work';

describe('humanize', () => {
  it('turns an enum value into a sentence-case phrase', () => {
    expect(humanize('FLEXIBLE')).toBe('Flexible');
    expect(humanize('HALF_DAY')).toBe('Half day');
    expect(humanize('WORK_FROM_HOME')).toBe('Work from home');
  });

  it('leaves an empty value empty', () => {
    expect(humanize('')).toBe('');
  });
});

describe('describeArrangement', () => {
  it('appends the free-text note when there is one', () => {
    expect(describeArrangement('OTHER', 'Weekends only')).toBe('Other — Weekends only');
  });

  it('shows only the label without a note', () => {
    expect(describeArrangement('ONSITE', null)).toBe('Onsite');
    expect(describeArrangement('ONSITE', '')).toBe('Onsite');
  });

  it('shows a dash when nothing has been chosen', () => {
    expect(describeArrangement(null, undefined)).toBe('—');
    expect(describeArrangement(undefined, 'note')).toBe('— — note');
  });
});

describe('workHours', () => {
  it('uses the contracted day when one is set', () => {
    expect(workHours({ workHoursPerDay: 6 })).toBe(6);
  });

  it('keeps a zero-hour day rather than replacing it with the default', () => {
    expect(workHours({ workHoursPerDay: 0 })).toBe(0);
  });

  it('falls back to the house default for an account created before the field existed', () => {
    expect(workHours({ workHoursPerDay: null })).toBe(DEFAULT_WORK_HOURS);
    expect(workHours({})).toBe(8);
  });
});
