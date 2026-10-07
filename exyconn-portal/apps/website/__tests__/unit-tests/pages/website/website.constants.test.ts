import { describe, expect, it } from 'vitest';
import {
  GIG_STATUSES,
  JOB_TYPES,
  SUBMISSION_STATUSES,
  WORK_MODES,
  toOptions,
} from '../../../../src/pages/website/website.constants';

describe('website constants', () => {
  it('keeps the display strings the public site renders verbatim', () => {
    expect(JOB_TYPES).toContain('Full Time');
    expect(WORK_MODES).toEqual(['Remote', 'On-site', 'Hybrid']);
    expect(GIG_STATUSES).toEqual(['open', 'in-progress', 'completed', 'cancelled']);
    expect(SUBMISSION_STATUSES).toEqual(['new', 'in-review', 'resolved', 'archived']);
  });

  it('turns a list of values into select options labelled by the value itself', () => {
    expect(toOptions(WORK_MODES)).toEqual([
      { label: 'Remote', value: 'Remote' },
      { label: 'On-site', value: 'On-site' },
      { label: 'Hybrid', value: 'Hybrid' },
    ]);
    expect(toOptions([])).toEqual([]);
  });
});
