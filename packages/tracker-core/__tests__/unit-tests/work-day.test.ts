import { describe, expect, it } from 'vitest';
import type { WorkProfile } from '../../src/types';
import {
  ATTENDANCE_OPTIONS,
  DEFAULT_WORK_HOURS,
  describeArrangement,
  humanize,
} from '../../src/work-day';

const PROFILE: WorkProfile = {
  workingTime: 'FIXED',
  workingTimeNote: '',
  workLocation: 'OFFICE',
  workLocationNote: '',
  workHoursPerDay: 8,
  targetMs: 8 * 3_600_000,
};

describe('humanize', () => {
  it('turns an enum value into a sentence-case phrase', () => {
    expect(humanize('HALF_DAY')).toBe('Half day');
    expect(humanize('FLEXIBLE')).toBe('Flexible');
  });

  it('copes with an empty value', () => {
    expect(humanize('')).toBe('');
  });
});

describe('describeArrangement', () => {
  it('describes a named arrangement without notes', () => {
    expect(describeArrangement(PROFILE)).toBe('Fixed · Office · 8h a day');
  });

  it('appends the free-text note where HR wrote one', () => {
    const profile: WorkProfile = {
      ...PROFILE,
      workingTime: 'OTHER',
      workingTimeNote: 'Mon-Wed only',
      workLocation: 'OTHER',
      workLocationNote: 'Client site',
      workHoursPerDay: 6,
    };

    expect(describeArrangement(profile)).toBe(
      'Other (Mon-Wed only) · Other (Client site) · 6h a day',
    );
  });
});

describe('work-day defaults', () => {
  it('matches the portal default working day', () => {
    expect(DEFAULT_WORK_HOURS).toBe(8);
  });

  it('offers present, from home and half day, in that order', () => {
    expect(ATTENDANCE_OPTIONS.map((option) => option.value)).toEqual([
      'PRESENT',
      'WFH',
      'HALF_DAY',
    ]);
  });
});
