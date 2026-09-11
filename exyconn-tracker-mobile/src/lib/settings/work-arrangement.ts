import {
  DEFAULT_WORK_HOURS,
  humanize,
  type SettingRow,
  type WorkProfile,
} from '@exyconn/tracker-core';

/** "Flexible", or "Other — Mon to Thu" when HR wrote what the arrangement means. */
function withNote(value: string, note: string): string {
  return note === '' ? humanize(value) : `${humanize(value)} — ${note}`;
}

/** What HR contracted this employee to work, as read-only label/value rows. */
export function workArrangementRows(profile: WorkProfile): SettingRow[] {
  return [
    {
      id: 'workingTime',
      label: 'Working time',
      value: withNote(profile.workingTime, profile.workingTimeNote),
    },
    {
      id: 'workLocation',
      label: 'Work location',
      value: withNote(profile.workLocation, profile.workLocationNote),
    },
    {
      id: 'workHoursPerDay',
      label: 'Hours per day',
      value: `${profile.workHoursPerDay}h (default ${DEFAULT_WORK_HOURS}h)`,
    },
  ];
}
