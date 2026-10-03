import { useState, type ReactElement } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  TRACKER_RADIUS,
  Typography,
} from '@exyconn/ui';
import HowToRegOutlined from '@mui/icons-material/HowToRegOutlined';
import type { AttendanceStatus, Workday } from '@shared/types';
import { ATTENDANCE_OPTIONS, humanize } from '@exyconn/tracker-core';
import { useT } from '@exyconn/i18n';
import { useAnnounce } from '../a11y/LiveAnnouncer';
import usePendingAction from '../hooks/usePendingAction';
import { run } from '../run';

interface Props {
  workday: Workday | null;
}

/**
 * Marking in for the day — the gate tracking sits behind.
 *
 * Attendance first, then tracking, and not the other way round: a timesheet for a day nobody
 * said they worked is a question payroll cannot answer later. It is the same record as the
 * employee portal's own "Mark attendance", so somebody who marked in there this morning
 * arrives here already done.
 */
export default function AttendanceGate({ workday }: Readonly<Props>): ReactElement {
  const t = useT();
  const [status, setStatus] = useState<AttendanceStatus>('PRESENT');
  const [note, setNote] = useState('');
  const { pending, error, perform } = usePendingAction<'mark'>();
  const busy = pending !== null;
  useAnnounce(error, 'assertive');

  // Null until the portal has said what today is — a loader, not a gap that later jumps in.
  if (workday === null) {
    return (
      <Stack role="status" direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <CircularProgress size={16} aria-hidden />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('Checking today’s attendance…')}
        </Typography>
      </Stack>
    );
  }

  if (workday.attendanceMarked) {
    const marked = t(humanize(workday.attendanceStatus ?? 'PRESENT'));
    const note = workday.attendanceNote;
    return (
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
        }}
      >
        {note
          ? t('Marked in today as {status} — {note}.', { status: marked, note })
          : t('Marked in today as {status}.', { status: marked })}
      </Typography>
    );
  }

  const mark = (): Promise<boolean> =>
    perform(
      'mark',
      () => window.tracker.markAttendance(status, note.trim() || null),
      t('Could not mark your attendance.'),
    );

  return (
    <Stack spacing={1.25}>
      <Alert severity="info" variant="outlined" sx={{ borderRadius: `${TRACKER_RADIUS}px` }}>
        {t('Mark your attendance for today before you start tracking.')}
      </Alert>
      <TextField
        select
        size="small"
        label={t('Attendance')}
        value={status}
        disabled={busy}
        onChange={(event) => setStatus(event.target.value as AttendanceStatus)}
      >
        {ATTENDANCE_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {t(option.label)}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        size="small"
        label={t('Note (optional)')}
        value={note}
        disabled={busy}
        onChange={(event) => setNote(event.target.value)}
      />
      {error !== null && (
        <Alert severity="error" variant="outlined" sx={{ borderRadius: `${TRACKER_RADIUS}px` }}>
          {error}
        </Alert>
      )}
      <Button
        variant="contained"
        startIcon={<HowToRegOutlined />}
        loading={busy}
        onClick={() => run(mark)}
      >
        {t('Mark attendance')}
      </Button>
    </Stack>
  );
}
