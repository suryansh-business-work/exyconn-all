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
import { ATTENDANCE_OPTIONS, humanize, trackerErrorText } from '@exyconn/tracker-core';
import { useT } from '@exyconn/i18n';
import { useAnnounce } from '../a11y/LiveAnnouncer';
import useAttendanceMark from '../hooks/useAttendanceMark';
import { run } from '../run';
import LocationFallbackDialog from './LocationFallbackDialog';
import LocationMapDialog from './LocationMapDialog';

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
 *
 * Where they are is pinned with it: the location is read first and shown on a map, and the
 * mark is only sent once they confirm that is where they are working from. When no location
 * can be read, a dialog says why and lets them mark in anyway — at their profile address, or
 * without a location — so a location problem never blocks the day.
 */
export default function AttendanceGate({ workday }: Readonly<Props>): ReactElement {
  const t = useT();
  const [status, setStatus] = useState<AttendanceStatus>('PRESENT');
  const [note, setNote] = useState('');
  const { fix, failure, pending, marking, error, locate, mark, cancel, retry } = useAttendanceMark(
    status,
    note,
  );
  const busy = pending !== null;
  const errorText = error === null ? null : trackerErrorText(error, workday, t);
  useAnnounce(errorText, 'assertive');

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
      {errorText !== null && fix === null && failure === null && (
        <Alert severity="error" variant="outlined" sx={{ borderRadius: `${TRACKER_RADIUS}px` }}>
          {errorText}
        </Alert>
      )}
      <Button
        variant="contained"
        startIcon={<HowToRegOutlined />}
        loading={pending === 'locate'}
        disabled={busy}
        onClick={() => run(locate)}
      >
        {t('Mark attendance')}
      </Button>
      <LocationFallbackDialog
        failure={failure}
        profileAddress={workday.profileAddress}
        marking={marking}
        error={errorText}
        onRetry={retry}
        onFallback={(fallback) => run(() => mark(fallback))}
        onClose={cancel}
      />
      <LocationMapDialog
        location={fix}
        title={t('Your location')}
        description={t(
          'Your attendance is marked with this location. Is this where you are working from?',
        )}
        onClose={cancel}
        confirm={{
          label: t('Confirm & mark attendance'),
          busy: pending === 'mark',
          error: errorText,
          // The pin on the map is the pin sent: never read again between confirm and send.
          onConfirm: () => {
            if (fix !== null) {
              run(() => mark(fix));
            }
          },
        }}
      />
    </Stack>
  );
}
