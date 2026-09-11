import type { ReactElement } from 'react';
import { Box, Divider, Stack, Typography } from '@exyconn/ui';
import type { TrackerState } from '@shared/types';
import Surface from '../components/Surface';
import AttendanceGate from '../components/AttendanceGate';
import AutoStopNotice from '../components/AutoStopNotice';
import DayProgress from '../components/DayProgress';
import PresencePicker from '../components/PresencePicker';
import ProjectPicker from '../components/ProjectPicker';
import TicketPicker from '../components/TicketPicker';
import StatGrid from '../components/StatGrid';
import StatusChip from '../components/StatusChip';
import SyncBar from '../components/SyncBar';
import TodayActivity from '../components/TodayActivity';
import TotalsPanel from '../components/TotalsPanel';
import TrackingControls from '../components/TrackingControls';
import { sessionTiles } from '../tiles';

interface Props {
  state: TrackerState;
}

/**
 * The day, then the controls, then TWO clearly separated blocks of numbers: the live counters
 * for the session in progress, and the employee's all-time totals from the portal. They are
 * never merged into one grid — a number that resets and a number that never does are
 * different facts, and each block's heading says which it is.
 *
 * The day's progress sits at the very top because it is the one number the employee is
 * actually working towards; everything below it explains how that number is being made.
 */
export default function DashboardScreen({ state }: Readonly<Props>): ReactElement {
  const { stats, status, settings, user, timezone, workday, workProfile, preferences } = state;
  const tracking = status === 'tracking' || status === 'paused';

  return (
    <Stack spacing={2.5}>
      <Surface sx={{ p: 2.5 }}>
        <DayProgress
          workday={workday}
          workProfile={workProfile}
          activeMs={stats.dayActiveMs}
          style={preferences.progressStyle}
        />
      </Surface>

      <Surface sx={{ p: 2.5 }}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700 }}>
              {user?.name ?? 'Signed in'}
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: 'text.secondary',
              }}
            >
              {user?.email ?? ''}
            </Typography>
          </Box>
          <StatusChip status={status} />
        </Stack>

        <Stack spacing={1.75}>
          <AttendanceGate workday={workday} />
          {/* Above the controls: the hour their time stops counting is worth knowing BEFORE
              they press start, not after the schedule has already stopped them. */}
          <AutoStopNotice settings={settings} timezone={timezone} status={status} />
          <ProjectPicker
            projects={state.projects}
            selectedProjectId={state.selectedProjectId}
            disabled={tracking}
          />
          <TicketPicker
            tasks={state.tasks}
            selectedTaskId={state.selectedTaskId}
            disabled={tracking}
          />
          <Divider />
          {/* Above the controls, not below: saying "I am at lunch" IS a tracking control —
              it pauses the session — and finding it under the buttons would make it look
              like a status somebody else reads rather than something that acts. */}
          <PresencePicker presence={state.presence} timezone={timezone} />
          <Divider />
          <TrackingControls status={status} attendanceMarked={workday?.attendanceMarked ?? false} />
        </Stack>
      </Surface>

      <TodayActivity timezone={timezone} lastSyncAt={stats.lastSyncAt} />

      <SyncBar stats={stats} settings={settings} timezone={timezone} />

      <Stack spacing={1}>
        <Stack spacing={0.25}>
          <Typography variant="subtitle2">This session</Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
            }}
          >
            Live counters for the run in progress — they reset to zero when you stop.
          </Typography>
        </Stack>
        <StatGrid tiles={sessionTiles(stats, settings)} />
      </Stack>

      <TotalsPanel lastSyncAt={stats.lastSyncAt} />
    </Stack>
  );
}
