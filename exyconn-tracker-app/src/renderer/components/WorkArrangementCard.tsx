import type { ReactElement } from 'react';
import { Typography } from '@exyconn/ui';
import type { WorkProfile } from '@shared/types';
import Surface from './Surface';
import SettingsList from './SettingsList';
import { DEFAULT_WORK_HOURS, humanize } from '../work-day';

interface Props {
  workProfile: WorkProfile | null;
}

/**
 * What HR contracted this employee to work, read-only.
 *
 * It sits on the settings screen next to the administrator's capture rules for the same
 * reason those do: the employee is entitled to see the terms the app measures them against,
 * and to notice when they are wrong. Only HR can change them.
 */
export default function WorkArrangementCard({ workProfile }: Readonly<Props>): ReactElement | null {
  if (workProfile === null) {
    return null;
  }

  const rows = [
    {
      id: 'workingTime',
      label: 'Working time',
      value: workProfile.workingTimeNote
        ? `${humanize(workProfile.workingTime)} — ${workProfile.workingTimeNote}`
        : humanize(workProfile.workingTime),
    },
    {
      id: 'workLocation',
      label: 'Work location',
      value: workProfile.workLocationNote
        ? `${humanize(workProfile.workLocation)} — ${workProfile.workLocationNote}`
        : humanize(workProfile.workLocation),
    },
    {
      id: 'workHoursPerDay',
      label: 'Hours per day',
      value: `${workProfile.workHoursPerDay}h (default ${DEFAULT_WORK_HOURS}h)`,
    },
  ];

  return (
    <Surface sx={{ p: 2.5 }}>
      <Typography variant="h6">Your working day</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1 }}>
        Set by HR on your employee record. Today&apos;s progress bar fills against these hours. Ask
        HR if it does not match your contract.
      </Typography>
      <SettingsList rows={rows} />
    </Surface>
  );
}
