import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import type { ReportDay } from '@shared/types';
import { activityPercent, formatCount, formatHoursMinutes } from '../format';
import { activityColor } from '../activity';
import { formatDayLabel } from '../time';
import Surface from './Surface';

const COLUMNS = ['Day', 'Worked', 'Idle', 'Activity', 'Keys', 'Mouse', 'Sessions'] as const;
const SKELETON_ROWS = ['s1', 's2', 's3', 's4', 's5'] as const;

interface Props {
  days: readonly ReportDay[];
  loading: boolean;
}

/** Day-by-day table of the employee's own tracked time. */
export default function ReportTable({ days, loading }: Readonly<Props>): JSX.Element {
  if (loading) {
    return (
      <Surface sx={{ p: 2 }}>
        <Stack spacing={1.25}>
          {SKELETON_ROWS.map((id) => (
            <Skeleton key={id} variant="rounded" height={40} />
          ))}
        </Stack>
      </Surface>
    );
  }

  if (days.length === 0) {
    return (
      <Surface sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="subtitle1">No tracked time this month</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Days appear here once you start tracking and sync.
        </Typography>
      </Surface>
    );
  }

  return (
    <Surface sx={{ p: 0, overflow: 'hidden' }}>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {COLUMNS.map((column) => (
                <TableCell key={column} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {days.map((day) => {
              const percent = activityPercent(day.activeMs, day.idleMs);
              return (
                <TableRow key={day.date} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDayLabel(day.date)}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {formatHoursMinutes(day.activeMs)}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {formatHoursMinutes(day.idleMs)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      variant="outlined"
                      color={activityColor(percent)}
                      label={`${percent}%`}
                    />
                  </TableCell>
                  <TableCell>{formatCount(day.keyCount)}</TableCell>
                  <TableCell>{formatCount(day.mouseCount)}</TableCell>
                  <TableCell>{formatCount(day.sessions)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Surface>
  );
}
