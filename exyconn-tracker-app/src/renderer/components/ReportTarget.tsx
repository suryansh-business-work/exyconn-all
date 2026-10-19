import type { ReactElement } from 'react';
import { Box, Typography } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import {
  formatHoursMinutes,
  formatSignedHoursMinutes,
  type MonthTarget,
} from '@exyconn/tracker-core';
import Surface from './Surface';

interface Props {
  target: MonthTarget;
  workHoursPerDay: number;
}

interface Figure {
  id: string;
  label: string;
  value: string;
  /** The deficit while behind: said in red as well as with its minus sign. */
  alert?: boolean;
}

function figuresOf(target: MonthTarget, leave: string): Figure[] {
  return [
    { id: 'expected', label: 'Expected this month', value: formatHoursMinutes(target.expectedMs) },
    { id: 'logged', label: 'Logged this month', value: formatHoursMinutes(target.workedMs) },
    {
      id: 'deficit',
      label: 'Deficit so far',
      value: formatSignedHoursMinutes(target.deficitMs),
      alert: target.deficitMs < 0,
    },
    { id: 'leave', label: 'Leave this month', value: leave },
  ];
}

/**
 * The month against the employee's contract: expected hours (approved leave and holidays
 * already taken off), hours logged, the deficit so far — negative while behind — and the
 * leave taken. The same figures the portal shows the employee's manager.
 */
export default function ReportTarget({ target, workHoursPerDay }: Readonly<Props>): ReactElement {
  const t = useT();
  const leave = t('{days} days (-{hours})', {
    days: target.leaveDates.size,
    hours: formatHoursMinutes(target.leaveMs),
  });
  return (
    <Surface sx={{ p: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
        {figuresOf(target, leave).map((item) => (
          <Box key={item.id}>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              {t(item.label)}
            </Typography>
            <Typography
              variant="h6"
              component="p"
              sx={{ color: item.alert ? 'error.main' : undefined, overflowWrap: 'anywhere' }}
            >
              {item.value}
            </Typography>
          </Box>
        ))}
      </Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
        {t(
          '{hours}h a day, Monday to Friday, less holidays and approved leave. Ringed red days fell short.',
          { hours: workHoursPerDay },
        )}
      </Typography>
    </Surface>
  );
}
