import { describe, expect, it } from 'vitest';
import type { WorkProfile } from '@exyconn/tracker-core';
import { workArrangementRows } from '../../../src/lib/settings/work-arrangement';

const PROFILE: WorkProfile = {
  workingTime: 'FLEXIBLE',
  workingTimeNote: '',
  workLocation: 'OTHER',
  workLocationNote: 'Client site on Fridays',
  workHoursPerDay: 7.5,
  targetMs: 7.5 * 3_600_000,
};

describe('workArrangementRows', () => {
  it('humanises the arrangement and appends HR’s note when there is one', () => {
    expect(workArrangementRows(PROFILE)).toEqual([
      { id: 'workingTime', label: 'Working time', value: 'Flexible' },
      { id: 'workLocation', label: 'Work location', value: 'Other — Client site on Fridays' },
      { id: 'workHoursPerDay', label: 'Hours per day', value: '7.5h (default 8h)' },
    ]);
  });
});
