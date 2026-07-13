import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { DayDetail } from '@shared/types';
import { activityPercent, formatCount, formatDayLabel } from '../format';
import GlassCard from './GlassCard';
import ReportTotals from './ReportTotals';
import ScreenshotGrid from './ScreenshotGrid';

interface Props {
  date: Date;
  detail: DayDetail | null;
  loading: boolean;
  error: string | null;
}

const SKELETON_TILES = ['t1', 't2', 't3', 't4'] as const;

/** Counts only — the tracker records how much you typed, never what you typed. */
function inputSummary(detail: DayDetail): string {
  const keys = formatCount(detail.keyCount);
  const clicks = formatCount(detail.mouseCount);
  const sessions = formatCount(detail.sessions);
  return `${keys} keys · ${clicks} clicks · ${sessions} sessions`;
}

/** The selected day: its totals, then a grid of the screenshots captured that day. */
export default function DayDetailPanel({
  date,
  detail,
  loading,
  error,
}: Readonly<Props>): JSX.Element {
  const heading = (
    <Typography variant="subtitle1" fontWeight={700}>
      {formatDayLabel(date.toISOString())}
    </Typography>
  );

  if (error !== null) {
    return (
      <Stack spacing={1}>
        {heading}
        <Alert severity="error" variant="outlined" sx={{ borderRadius: '4px' }}>
          {error}
        </Alert>
      </Stack>
    );
  }

  if (loading || detail === null) {
    return (
      <Stack spacing={1}>
        {heading}
        <Skeleton variant="rounded" height={72} />
        <GlassCard sx={{ p: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          {SKELETON_TILES.map((id) => (
            <Skeleton key={id} variant="rounded" height={96} />
          ))}
        </GlassCard>
      </Stack>
    );
  }

  return (
    <Stack spacing={1}>
      {heading}

      <ReportTotals
        totals={{
          activeMs: detail.activeMs,
          idleMs: detail.idleMs,
          activityPercent: activityPercent(detail.activeMs, detail.idleMs),
        }}
      />

      <Typography variant="caption" color="text.secondary">
        {inputSummary(detail)}
      </Typography>

      <GlassCard sx={{ p: 2 }}>
        <ScreenshotGrid shots={detail.screenshots} />
      </GlassCard>
    </Stack>
  );
}
