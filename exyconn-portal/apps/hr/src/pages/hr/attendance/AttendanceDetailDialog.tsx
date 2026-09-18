import { useT } from '@exyconn/i18n';
import {
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Text,
} from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { DetailFact, DetailFactGrid } from '@exyconn/shell/components/data/DetailFact';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { activityPercent } from '@exyconn/shell/pages/tracker-view/tracker.format';
import { durationOrDash, projectLabel, type AttendanceEntryRow } from './attendance-grid';

interface AttendanceDetailDialogProps {
  entry: AttendanceEntryRow | null;
  onClose: () => void;
}

type Tracker = AttendanceEntryRow['tracker'];

/** Time per project that day, the busiest first — as the server sorted it. */
function ProjectBreakdown({ tracker }: Readonly<{ tracker: Tracker }>) {
  const t = useT();
  if (tracker.projects.length === 0) {
    return (
      <Text size="sm" color="text.secondary">
        {t('Nothing was tracked on this day.')}
      </Text>
    );
  }
  return (
    <Table size="small" aria-label={t('Time by project')}>
      <TableHead>
        <TableRow>
          <TableCell>{t('Project')}</TableCell>
          <TableCell align="right">{t('Active')}</TableCell>
          <TableCell align="right">{t('Off-computer')}</TableCell>
          <TableCell align="right">{t('Sessions')}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {tracker.projects.map((project) => (
          <TableRow key={project.projectId || 'none'}>
            <TableCell>{projectLabel(project, t)}</TableCell>
            <TableCell align="right">{durationOrDash(project.activeMs)}</TableCell>
            <TableCell align="right">{durationOrDash(project.manualMs)}</TableCell>
            <TableCell align="right">{project.sessions}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** The day's tracker totals, measured and claimed time kept apart. */
function TrackerFacts({ tracker }: Readonly<{ tracker: Tracker }>) {
  const { formatTime } = useSettings();
  const tracked = tracker.activeMs + tracker.idleMs > 0;
  return (
    <DetailFactGrid>
      <DetailFact label="Active time">{durationOrDash(tracker.activeMs)}</DetailFact>
      <DetailFact label="Idle time">{durationOrDash(tracker.idleMs)}</DetailFact>
      <DetailFact label="Activity">
        {tracked ? `${activityPercent(tracker.activeMs, tracker.idleMs)}%` : '—'}
      </DetailFact>
      <DetailFact label="Off-computer">{durationOrDash(tracker.manualMs)}</DetailFact>
      <DetailFact label="Sessions">{tracker.sessions}</DetailFact>
      <DetailFact label="First started">
        {tracker.firstStartedAt ? formatTime(tracker.firstStartedAt) : '—'}
      </DetailFact>
      <DetailFact label="Last ended">
        {tracker.lastEndedAt ? formatTime(tracker.lastEndedAt) : '—'}
      </DetailFact>
    </DetailFactGrid>
  );
}

/** One attendance day in brief: who, their status, and what the tracker saw them work on. */
export function AttendanceDetailDialog({ entry, onClose }: Readonly<AttendanceDetailDialogProps>) {
  const t = useT();
  const { formatDate } = useSettings();

  if (!entry) {
    return null;
  }

  return (
    <CrudDialog open title={entry.employeeName} onClose={onClose}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <StatusChip value={entry.status} />
          <Text size="sm" color="text.secondary">
            {formatDate(entry.date)}
          </Text>
        </Stack>
        <DetailFactGrid>
          <DetailFact label="Email">{entry.employeeEmail || '—'}</DetailFact>
          <DetailFact label="Designation">{entry.designation ?? '—'}</DetailFact>
          <DetailFact label="Department">{entry.department ?? '—'}</DetailFact>
          <DetailFact label="Note">{entry.note ?? '—'}</DetailFact>
        </DetailFactGrid>
        <Divider />
        <Text size="overline" color="text.secondary">
          {t('Tracker')}
        </Text>
        <TrackerFacts tracker={entry.tracker} />
        <Divider />
        <Text size="overline" color="text.secondary">
          {t('Time by project')}
        </Text>
        <ProjectBreakdown tracker={entry.tracker} />
      </Stack>
    </CrudDialog>
  );
}
