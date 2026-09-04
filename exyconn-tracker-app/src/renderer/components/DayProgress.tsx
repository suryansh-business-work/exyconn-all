import type { ReactElement } from 'react';
import { Box, LinearProgress, Stack, Tooltip, Typography } from '@exyconn/ui';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import type { WorkProfile, Workday } from '@shared/types';
import { formatHoursMinutes } from '../format';
import { DEFAULT_WORK_HOURS } from '../work-day';

interface Props {
  workday: Workday | null;
  workProfile: WorkProfile | null;
  /** Worked today INCLUDING the session in progress — the live number, not the synced one. */
  activeMs: number;
}

/**
 * How much of today's contracted day is done, at the top of the tracker.
 *
 * Active time only: idle minutes are time at a desk, not time worked, and a bar that counted
 * them would fill on its own while nobody was there. The target comes from HR's employee
 * record — the app states where it came from rather than presenting 8 hours as its own idea,
 * because an employee who thinks the tracker invented their working day has no way to
 * challenge it.
 */
export default function DayProgress({
  workday,
  workProfile,
  activeMs,
}: Readonly<Props>): ReactElement {
  const targetMs = workday?.targetMs ?? workProfile?.targetMs ?? 0;
  const hours = workProfile?.workHoursPerDay ?? DEFAULT_WORK_HOURS;
  const percent = targetMs > 0 ? Math.min(100, Math.round((activeMs / targetMs) * 100)) : 0;
  const remainingMs = Math.max(0, targetMs - activeMs);
  const done = remainingMs === 0 && targetMs > 0;

  return (
    <Box>
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1}>
        <Typography variant="subtitle2">Today</Typography>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {formatHoursMinutes(activeMs)} of {formatHoursMinutes(targetMs)}
          </Typography>
          <Tooltip
            title={`Your working day is ${hours} hours, set by HR on your employee record. The default is ${DEFAULT_WORK_HOURS}. Only ACTIVE time counts — idle minutes do not fill this bar.`}
          >
            <InfoOutlined sx={{ fontSize: 15, color: 'text.secondary' }} />
          </Tooltip>
        </Stack>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={percent}
        color={done ? 'success' : 'primary'}
        sx={{ height: 8, borderRadius: 4, my: 0.75 }}
      />

      <Typography variant="caption" color="text.secondary">
        {done
          ? `Full ${hours}h day complete.`
          : `${percent}% — ${formatHoursMinutes(remainingMs)} left of your ${hours}h day.`}
      </Typography>
    </Box>
  );
}
