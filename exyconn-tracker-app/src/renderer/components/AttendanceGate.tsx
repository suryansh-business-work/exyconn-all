import { useState, type ReactElement } from 'react';
import { Alert, Button, MenuItem, Stack, TextField, TRACKER_RADIUS, Typography } from '@exyconn/ui';
import HowToRegOutlined from '@mui/icons-material/HowToRegOutlined';
import type { AttendanceStatus, Workday } from '@shared/types';
import { ATTENDANCE_OPTIONS, humanize } from '@exyconn/tracker-core';
import { useT } from '@exyconn/i18n';
import { useAnnounce } from '../a11y/LiveAnnouncer';

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
export default function AttendanceGate({ workday }: Readonly<Props>): ReactElement | null {
  const t = useT();
  const [status, setStatus] = useState<AttendanceStatus>('PRESENT');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useAnnounce(error, 'assertive');

  if (workday === null) {
    return null;
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

  async function mark(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await window.tracker.markAttendance(status, note.trim() || null);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : t('Could not mark your attendance.'));
    } finally {
      setBusy(false);
    }
  }

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
        disabled={busy}
        onClick={() => {
          mark().catch((cause: unknown) => console.error('Mark attendance failed', cause));
        }}
      >
        {t('Mark attendance')}
      </Button>
    </Stack>
  );
}
